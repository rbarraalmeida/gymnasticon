import {EventEmitter} from 'events';
import {Timer} from '../util/timer';
import {scan, createNameFilter} from '../util/ble-scan';
import {macAddress} from '../util/mac-address';
import {createDropoutFilter} from '../util/dropout-filter';

export const KEISER_LOCALNAME = "M3";
const KEISER_VALUE_MAGIC = Buffer.from([0x02, 0x01]); // identifies Keiser data message
const KEISER_VALUE_IDX_EQUIPMENT_ID = 5; // 8-bit Equipment Code
const KEISER_VALUE_IDX_POWER = 10; // 16-bit power (watts) data offset within packet
const KEISER_VALUE_IDX_CADENCE = 6; // 16-bit cadence (1/10 rpm) data offset within packet
const KEISER_VALUE_IDX_DURATION_MINUTES = 14; // 8-bit duration minutes data offset within packet
const KEISER_VALUE_IDX_DURATION_SECONDS = 15; // 8-bit duration seconds data offset within packet
const KEISER_VALUE_IDX_DISTANCE = 16; // 16-bit Distance data offset within packet
const KEISER_VALUE_IDX_REALTIME = 4; // Indicates whether the data present is realtime (0, or 128 to 227)
const KEISER_VALUE_IDX_VER_MAJOR = 2; // 8-bit Version Major data offset within packet
const KEISER_VALUE_IDX_VER_MINOR = 3; // 8-bit Version Major data offset within packet
const KEISER_STATS_NEWVER_MINOR = 30; // Version Minor when broadcast interval was changed from ~ 2 sec to ~ 0.3 sec
const KEISER_STATS_TIMEOUT_OLD = 7.0; // Old Bike: If no stats received within 7 sec, reset power and cadence to 0
const KEISER_STATS_TIMEOUT_NEW = 2.0; // New Bike: If no stats received within 2 sec, reset power and cadence to 0
const KEISER_BIKE_TIMEOUT = 10 * 60.0; // Consider bike disconnected if no stats have been received for 20 minutes

const debuglog = require('debug')('gym:bikes:keiser');

/**
 * Handles communication with Keiser bikes
 * Developer documentation can be found at https://dev.keiser.com/mseries/direct/
 */

export class KeiserBikeClient extends EventEmitter {
  /**
   * Create a KeiserBikeClient instance.
   * @param {Noble} noble - a Noble instance
   * @param {number} bikeId - the id for the bike
   * @param {number} useDistanceForSpeed - whether to use distance for speed
   */
  constructor(noble, bikeId, useDistanceForSpeed) {
    super();
    this.noble = noble;
    this.bikeId = bikeId;
    this.useDistanceForSpeed = useDistanceForSpeed;
    this.state = 'disconnected';
    this.onReceive = this.onReceive.bind(this);
  }


  /**
   * Bike behaves like a BLE beacon. Simulate connect by looking up MAC address
   * scanning and filtering subsequent announcements from this address.
   */
  async connect() {
    if (this.state === 'connected') {
      throw new Error('Already connected');
    }

    // Scan for bike with equipment id
    const filters = [];
    filters.push(createNameFilter(KEISER_LOCALNAME));
    filters.push(createBikeIdFilter(this.bikeId));
    const filter = (peripheral) => filters.every(f => f(peripheral));
    this.peripheral = await scan(this.noble, null, filter);

    this.state = 'connected';

    // Determine bike firmware version and set stats timeout
    let bikestatstimeout = KEISER_STATS_TIMEOUT_OLD; // Fallback for unknown firmware version
    try {
      bikestatstimeout = bikeVersion(this.peripheral.advertisement.manufacturerData).timeout;
    } catch (e) {
      console.log("Keiser M3 bike: Unknown version detected");
      this.onBikeTimeout(); // Disconnect as this data cannot be handled
    }

    // Reset stats to 0 when bike suddenly dissapears
    this.statsTimeout = new Timer(bikestatstimeout, {repeats: false});
    this.statsTimeout.on('timeout', this.onStatsTimeout.bind(this));

    // Consider bike disconnected if no stats have been received for certain time
    this.bikeTimeout = new Timer(KEISER_BIKE_TIMEOUT, {repeats: false});
    this.bikeTimeout.on('timeout', this.onBikeTimeout.bind(this));

    // Create filter to fix power and cadence dropouts
    this.fixDropout = createDropoutFilter();

    // Waiting for data
    await this.noble.startScanningAsync(null, true);
    this.noble.on('discover', this.onReceive);

    // Workaround for noble stopping to scan after connect to bleno
    // See https://github.com/noble/noble/issues/223
    this.noble.on('scanStop', this.restartScan);
  }

  /**
   * Get the bike's MAC address.
   * @returns {string} mac address
   */
  get address() {
    return macAddress(this.peripheral.address);
  }

  /**
   * Handle data received from the bike.
   * @param {buffer} data - raw data encoded in proprietary format.
   * @emits BikeClient#data
   * @emits BikeClient#stats
   * @private
   */
   onReceive(data) {
     try {
       if (data.address == this.peripheral.address) {
         this.emit('data', data);
         const {type, payload} = parse(data.advertisement.manufacturerData, this.useDistanceForSpeed);
         if (type === 'stats') {
           const fixed = this.fixDropout(payload);
           if (fixed.power !== payload.power) {
             debuglog(`*** replaced zero power with previous power ${fixed.power}`);
           }
           if (fixed.cadence !== payload.cadence) {
             debuglog(`*** replaced zero cadence with previous cadence ${fixed.cadence}`);
           }
           if (fixed.speed !== payload.speed) {
             debuglog(`*** replaced zero speed with previous speed ${fixed.speed}`);
           }
           debuglog('Found Keiser M3: ', data.advertisement.localName, ' Address: ', data.address, ' Data: ', data.advertisement.manufacturerData, 'Power: ', fixed.power, 'Cadence: ', fixed.cadence, 'Speed:', fixed.speed);
           this.emit(type, fixed);
           this.statsTimeout.reset();
           this.bikeTimeout.reset();
         }
       }
     } catch (e) {
       if (!/unable to parse message/.test(e)) {
         throw e;
       }
     }
   }

  /**
   * Set power & cadence to 0 when the bike dissapears
   */
  async onStatsTimeout() {
    const reset = { power:0, cadence:0, speed: 0 };
    debuglog('Stats timeout exceeded');
    console.log("Stats timeout: Restarting BLE Scan");
    if (this.state === 'connected') {
      if (this.noble.state === 'poweredOn') {
        try {
          await this.noble.startScanningAsync(null, true);
        } catch (err) {
          console.log("Stats timeout: Unable to restart BLE Scan: " + err);
          this.emit('stats', reset);
        }
      } else {
        console.log("Stats timeout: Bluetooth no longer powered on");
        this.onBikeTimeout();
        this.emit('stats', reset);
      }
    }
  }

  /**
  * Consider Bike disconnected after certain time
  */
  onBikeTimeout() {
    debuglog('M3 Bike disconnected');
    this.state = 'disconnected';
    this.noble.off('scanStop', this.restartScan);
    this.emit('disconnect', {address: this.peripheral.address});
  }

  /**
   * Restart BLE scanning while in connected state
   * Workaround for noble stopping to scan after connect to bleno
   * See https://github.com/noble/noble/issues/223
   */
  async restartScan() {
    console.log("Restarting BLE Scan");
    try {
      await this.startScanningAsync(null, true);
    } catch (err) {
      console.log("Unable to restart BLE Scan: " + err);
    }
  }
}

/**
 * Determine Keiser Bike Firmware version.
 * This helps determine the correct value for the Stats
 * timeout. Older versions of the bike send data only every
 * 2 seconds, while newer bikes send data every 300 ms.
 * @param {buffer} data - raw characteristic value.
 * @returns {string} version - bike version number as string
 * @returns {object} timeout - stats timeout for this bike version
 */
export function bikeVersion(data) {
  let version = "Unknown";
  let timeout = KEISER_STATS_TIMEOUT_OLD;
  if (data.indexOf(KEISER_VALUE_MAGIC) === 0) {
    const major = data.readUInt8(KEISER_VALUE_IDX_VER_MAJOR);
    const minor = data.readUInt8(KEISER_VALUE_IDX_VER_MINOR);
    version = major.toString(16) + "." + minor.toString(16);
    if ((major === 6) && (minor >= parseInt(KEISER_STATS_NEWVER_MINOR, 16))) {
      timeout = KEISER_STATS_TIMEOUT_NEW;
    }
    console.log("Keiser M3 bike version: ", version, " (Stats timeout: ", timeout, " sec.)");
    return { version, timeout };
  }
  throw new Error('unable to parse bike version data');
}


/**
 * Determine Keiser Bike ID.
 * @param {buffer} data - raw characteristic value.
 * @returns {number} id - ike id or -1 if id cant be found
 *  */
export function readBikeId(data) {
  let id = -1;
  if (data.indexOf(KEISER_VALUE_MAGIC) === 0) {
    id = data.readUInt8(KEISER_VALUE_IDX_EQUIPMENT_ID);
  }
  console.log("Keiser M3 bike id: ", id);
  return id;
}

/**
 * Create a function that filters Keiser peripheral by bike id.
 * @param {number} bikeId - Id for the bike to connect
 * @returns {FilterFunction} - the filter function
*/
export function createBikeIdFilter(bikeId) {
 return (peripheral) => peripheral && 
  peripheral.advertisement && 
  peripheral.advertisement.manufacturerData && 
  bikeId === readBikeId(peripheral.advertisement.manufacturerData);
}


/**
 * Parse Keiser Bike Data characteristic value.
 * Consider if provided value are realtime or review mode
 * See https://dev.keiser.com/mseries/direct/#data-type
 * @param {buffer} data - raw characteristic value.
 * @param {useDistanceForSpeed} number - whether to use distance for speed
 * @returns {object} message - parsed message
 * @returns {string} message.type - message type
 * @returns {object} message.payload - message payload
 */
export function parse(data, useDistanceForSpeed) {
  if (data.indexOf(KEISER_VALUE_MAGIC) === 0) {
    const realtime = data.readUInt8(KEISER_VALUE_IDX_REALTIME);
    if (realtime === 0 || (realtime > 128 && realtime < 255)) {
      // Realtime data received
      const power = data.readUInt16LE(KEISER_VALUE_IDX_POWER);
      const cadence = Math.round(data.readUInt16LE(KEISER_VALUE_IDX_CADENCE) / 10);
      // Uses power estimate
      let speed = calcPowerToSpeed(power);
      if (useDistanceForSpeed) {
        // See https://dev.keiser.com/mseries/direct/#advertising-data-structure
        const durationMinutes = data.readUInt8(KEISER_VALUE_IDX_DURATION_MINUTES);
        const durationSeconds = durationMinutes * 60 + data.readUInt8(KEISER_VALUE_IDX_DURATION_SECONDS);
        if (durationSeconds > 0) {
          let distance = data.readInt16LE(KEISER_VALUE_IDX_DISTANCE);
          speed = calcDistanceDurationToSpeed(distance, durationSeconds);
        }
      } 
      return {type: 'stats', payload: {power, cadence, speed}};
    }
  }
  throw new Error('unable to parse message');
}

// TODO: move this to util
export function calcPowerToSpeed(power) {
  // Calculate Speed based on
  // https://ihaque.org/posts/2020/12/25/pelomon-part-ib-computing-speed/
  let speed = 0;
  const r = Math.sqrt(power);
  if (power < 26) {
    speed = ( ( 0.057 - 0.172 * r + 0.759 * Math.pow(r,2) - 0.079 * Math.pow(r,3)) * 1.609344 ).toFixed(1);
  } else {
    speed = ( ( -1.635 + 2.325 * r - 0.064 * Math.pow(r,2) + 0.001 * Math.pow(r,3)) * 1.609344 ).toFixed(1);
  }
  return speed;
}

export function calcDistanceDurationToSpeed(distance, durationSeconds) {
  if (distance > 0) {
    // Distance is in 10x Miles.
    distance = distance * 1.609;
  } else {
    // Distance is in 10x KM.
    distance = distance * (-1);
  }
  return ((distance * 60 * 60)/(durationSeconds * 10)).toFixed(1);
}