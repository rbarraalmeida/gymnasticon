import noble from '@abandonware/noble';
import bleno from '@abandonware/bleno';

import {once} from 'events';

import {GymnasticonServer} from '../servers/ble';
import {AntServer} from '../servers/ant';
import {createBikeClient, getBikeTypes} from '../bikes';
import {CrankSimulation} from './crankSimulation';
import {WheelSimulation} from './wheelSimulation';
import {Timer} from '../util/timer';
import {Logger} from '../util/logger';
import {createAntStick} from '../util/ant-stick';

const debuglog = require('debug')('gym:app:app');

export {getBikeTypes};

export const defaults = {
  // bike options
  bike: 'autodetect', // bike type
  bikeReceiveTimeout: 4, // timeout for receiving stats from bike
  bikeConnectTimeout: 0, // timeout for establishing bike connection
  bikeAdapter: 'hci0', // bluetooth adapter to use for bike connection (BlueZ only)

  // flywheel bike options
  flywheelAddress: undefined, // mac address of bike
  flywheelName: 'Flywheel 1', // name of bike

  // peloton bike options
  pelotonPath: '/dev/ttyUSB0', // default path for usb to serial device

  // Keiser bike id
  keiserBikeId: 8, // default bike for keiser

  // Whether to use distance to compute distance for keiser
  keiserUseDistanceForSpeed: 1,

  // test bike options
  botPower: 0, // power
  botCadence: 0, // cadence
  botSpeed: 0, // speed
  botHost: '0.0.0.0', // listen for udp message to update cadence/power
  botPort: 3000,

  // server options
  serverAdapter: 'hci0', // adapter for receiving connections from apps
  serverName: 'Gymnasticon', // how the Gymnasticon will appear to apps
  serverPingInterval: 1, // send a power measurement update at least this often

  // ANT+ server options
  antDeviceId: 11234, // random default ANT+ device id

  // power adjustment (to compensate for inaccurate power measurements on bike)
  powerScale: 1.0, // multiply power by this
  powerOffset: 0.0, // add this to power

  // speed adjustment (to compensate for inaccurate speed measurements on bike)
  speedScale: 1.0, // multiply speed by this
  speedOffset: 0.0, // add this to speed
};

/**
 * Gymnasticon App.
 *
 * Converts the Flywheel indoor bike's non-standard data protocol into the
 * standard Bluetooth Cycling Power Service so the bike can be used with
 * apps like Zwift.
 */
export class App {
  /**
   * Create an App instance.
   */
  constructor(options = {}) {
    const opts = {...defaults, ...options};


    // test
    var term = require( 'terminal-kit' ).terminal ;

// The term() function simply output a string to stdout, using current style
// output "Hello world!" in default terminal's colors
term( 'Hello world!\n' ) ;

// This output 'red' in red
term.red( 'red' ) ;

// This output 'bold' in bold
term.bold( 'bold' ) ;

// output 'mixed' using bold, underlined & red, exposing the style-mixing syntax
term.bold.underline.red( 'mixed' ) ;

// printf() style formatting everywhere:
// this will output 'My name is Jack, I'm 32.' in green
term.green( "My name is %s, I'm %d.\n" , 'Jack' , 32 ) ;

// Since v0.16.x, style markup are supported as a shorthand.
// Those two lines produce the same result.
term( "My name is " ).red( "Jack" )( " and I'm " ).green( "32\n" ) ;
term( "My name is ^rJack^ and I'm ^g32\n" ) ;

// Width and height of the terminal
term( 'The terminal size is %dx%d' , term.width , term.height ) ;

// Move the cursor at the upper-left corner
term.moveTo( 1 , 1 ) ;

// We can always pass additional arguments that will be displayed...
term.moveTo( 1 , 1 , 'Upper-left corner' ) ;

// ... and formated
term.moveTo( 1 , 1 , "My name is %s, I'm %d.\n" , 'Jack' , 32 ) ;

// ... or even combined with other styles
term.moveTo.cyan( 1 , 1 , "My name is %s, I'm %d.\n" , 'Jack' , 32  ) ;

// Get some user input
term.magenta( "Enter your name: " ) ;
term.inputField(
	function( error , input ) {
		term.green( "\nYour name is '%s'\n" , input ) ;
	}
) ;
    // test

    this.power = 0;
    this.cadence= 0;
    this.crank = {revolutions: 0, timestamp: -Infinity};
    this.wheel = {revolutions: 0, timestamp: -Infinity};

    process.env['NOBLE_HCI_DEVICE_ID'] = opts.bikeAdapter;
    process.env['BLENO_HCI_DEVICE_ID'] = opts.serverAdapter;
    if (opts.bikeAdapter === opts.serverAdapter) {
      process.env['NOBLE_MULTI_ROLE'] = '1'
    }

    this.opts = opts;
    this.logger = new Logger();
    this.crankSimulation = new CrankSimulation();
    this.wheelSimulation = new WheelSimulation();
    this.server = new GymnasticonServer(bleno, opts.serverName);

    this.antStick = createAntStick(opts);
    this.antServer = new AntServer(this.antStick, {deviceId: opts.antDeviceId});
    this.antStick.on('startup', this.onAntStickStartup.bind(this));

    this.pingInterval = new Timer(opts.serverPingInterval);
    this.statsTimeout = new Timer(opts.bikeStatsTimeout, {repeats: false});
    this.connectTimeout = new Timer(opts.bikeConnectTimeout, {repeats: false});
    this.powerScale = opts.powerScale;
    this.powerOffset = opts.powerOffset;
    this.speedScale = opts.speedScale;
    this.speedOffset = opts.speedOffset;

    this.pingInterval.on('timeout', this.onPingInterval.bind(this));
    this.statsTimeout.on('timeout', this.onBikeStatsTimeout.bind(this));
    this.connectTimeout.on('timeout', this.onBikeConnectTimeout.bind(this));
    this.crankSimulation.on('pedal', this.onPedalStroke.bind(this));
    this.wheelSimulation.on('wheel', this.onWheelRotation.bind(this));

    this.onSigInt = this.onSigInt.bind(this);
    this.onExit = this.onExit.bind(this);
  }

  async run() {
    try {
      process.on('SIGINT', this.onSigInt);
      process.on('exit', this.onExit);

      const [state] = await once(noble, 'stateChange');
      if (state !== 'poweredOn')
        throw new Error(`Bluetooth adapter state: ${state}`);

      this.logger.log('connecting to bike...');
      this.bike = await createBikeClient(this.opts, noble);
      this.bike.on('disconnect', this.onBikeDisconnect.bind(this));
      this.bike.on('stats', this.onBikeStats.bind(this));
      this.connectTimeout.reset();
      await this.bike.connect();
      this.connectTimeout.cancel();
      this.logger.log(`bike connected ${this.bike.address}`);
      this.server.start();
      this.startAnt();
      this.pingInterval.reset();
      this.statsTimeout.reset();
    } catch (e) {
      this.logger.error(e);
      process.exit(1);
    }
  }

  onPedalStroke(timestamp) {
    this.pingInterval.reset();
    this.crank.timestamp = timestamp;
    this.crank.revolutions++;
    let {power, crank, wheel, cadence} = this;
    this.logger.log(`pedal stroke [timestamp=${timestamp} revolutions=${crank.revolutions} cadence=${cadence}rpm power=${power}W]`);
    //this.server.updateMeasurement({ power, crank, wheel });
    this.antServer.updateMeasurement({ power, cadence, crank });
  }

  onWheelRotation(timestamp) {
    this.pingInterval.reset();
    this.wheel.timestamp = timestamp;
    this.wheel.revolutions++;
    let {power, crank, wheel, cadence} = this;
    this.logger.log(`wheel rotation [timestamp=${timestamp} revolutions=${wheel.revolutions} speed=${this.wheelSimulation.speed}km/h power=${power}W]`);
    //this.server.updateMeasurement({ power, crank, wheel });
    this.antServer.updateMeasurement({ power, cadence, wheel });
  }

  onPingInterval() {
    debuglog(`pinging app since no stats or pedal strokes for ${this.pingInterval.interval}s`);
    let {power, crank, wheel, cadence} = this;
    this.server.updateMeasurement({ power, crank, wheel });
    this.antServer.updateMeasurement({ power, cadence });
  }

  onBikeStats({ power, cadence, speed}) {
    power = power > 0 ? Math.max(0, Math.round(power * this.powerScale + this.powerOffset)) : 0;
    speed = speed > 0 ? Math.max(0, Math.round(speed * this.speedScale + this.speedOffset)) : 0;
    this.logger.log(`received stats from bike [power=${power}W cadence=${cadence}rpm speed=${speed}km/h]`);
    this.statsTimeout.reset();
    this.power = power;
    this.cadence = cadence;
    this.crankSimulation.cadence = cadence;
    this.wheelSimulation.speed = speed;
    let {crank, wheel} = this;
    this.server.updateMeasurement({ power, crank, wheel });
    this.antServer.updateMeasurement({ power, cadence });
  }

  onBikeStatsTimeout() {
    this.logger.log(`timed out waiting for bike stats after ${this.statsTimeout.interval}s`);
    process.exit(0);
  }

  onBikeDisconnect({ address }) {
    this.logger.log(`bike disconnected ${address}`);
    process.exit(0);
  }

  onBikeConnectTimeout() {
    this.logger.log(`bike connection timed out after ${this.connectTimeout.interval}s`);
    process.exit(1);
  }

  startAnt() {
    if (!this.antStick.is_present()) {
      this.logger.log('no ANT+ stick found');
      return;
    }
    if (!this.antStick.open()) {
      this.antStick.
      this.logger.error('failed to open ANT+ stick ${this.}');
    }
  }

  onAntStickStartup() {
    this.logger.log('ANT+ stick opened');
    this.antServer.start();
  }

  stopAnt() {
    this.logger.log('stopping ANT+ server');
    this.antServer.stop();
  }

  onSigInt() {
    const listeners = process.listeners('SIGINT');
    if (listeners[listeners.length-1] === this.onSigInt) {
      process.exit(0);
    }
  }

  onExit() {
    if (this.antServer.isRunning) {
      this.stopAnt();
    }
  }
}
