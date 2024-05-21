import { Palette } from "terminal-kit";
import { ZoneBar } from "./zoneBar";

const TIMEOUT = 500; // 500 miliseconds - 0.5 second
const CADENCE_LABEL = "CAD";
const SPEED_LABEL = "VEL";
const POWER_LABEL = "POT";
const POWER_PERC_LABEL = "POR";
const SPRITE_DIR = "/home/pi/gymnasticon/lib/datagen/data/";
const CHARACTERS = ['0', '1', '2', '3', 
    '4', '5', '6', '7', '8', '9', '.',
    'A', 'C', 'D', 'E', 'L', 'P', 
    'R', 'T', 'V', 'O'];

const termkit = require('terminal-kit');

const DEBUG = false;

export class TextClient {
  /**
   * Create a TextClient instance.
   * @param {number} riderFtp - the ftp for the rider
   */
  constructor(riderFtp) {
    this.riderFtp = riderFtp;
    this.cadence = 0;
    this.speed = 0;
    this.power = 0;
    this.sprites = {};
    this.yPos = 1;
    this.xPos = 1;
  }

  async build() {
    var _this = this;
    termkit.getDetectedTerminal( function( error , detectedTerm ) {
		
      if ( error ) { throw new Error( 'Cannot detect terminal.' ) ; }
      
      _this.term = detectedTerm ;
      var palette = new Palette();
      palette.generate();
  
      _this.buffer = new termkit.ScreenBuffer( 
        { dst: _this.term , 
          width: Math.max(_this.term.width, 40), 
          height: Math.max(_this.term.height, 40),
          delta: true,
          palette: palette,
        }) ;
      _this.term.fullscreen();
      if (!DEBUG) {
        _this.term.hideCursor();
      }

      _this.zoneBar = new ZoneBar(_this.buffer, _this.riderFtp);
      _this.zoneBar.build();
    
      CHARACTERS.forEach((element) => _this.loadSprite(element));
      _this.number_of_characters = Math.floor((_this.term.width - 2) / _this.sprites['A'].width);
      _this.metric_padding = _this.number_of_characters - 4;
      _this.line_padding = Math.floor((_this.term.width - (_this.number_of_characters * _this.sprites['A'].width)) / 2);
      _this.draw();
    } ) ;
  }

  loadSprite(character) {
    this.sprites[character] = termkit.ScreenBuffer.loadSync(
      `${SPRITE_DIR}${character}.sbuf`);
  }

  /**
   * Updates the UI.
   * @param {number} cadence 
   * @param {number} speed 
   * @param {number} power 
   */
  update(cadence, speed, power) {
    this.cadence = cadence;
    this.speed = speed;
    this.power = power;
  }

  pad(num, size) {
    num = num.toString();
    while (num.length < size) num = " " + num;
    return num;
  }

  /**
   * Draws the UI.
   */
  draw() {
    this.zoneBar.updatePower(this.power);

    var lines = [];
    var power_perc = this.zoneBar.getPowerPerc();
    
    lines.push(`${CADENCE_LABEL} ${this.pad(this.cadence, this.metric_padding)}`);
    lines.push(`${SPEED_LABEL} ${this.pad(this.speed, this.metric_padding)}`);
    lines.push(`${POWER_LABEL} ${this.pad(this.power, this.metric_padding)}`);
    lines.push(`${POWER_PERC_LABEL} ${this.pad(power_perc, this.metric_padding)}`);

    this.buffer.clear();
    this.buffer.fill({ attr: { bgColor: 'black' }});
    this.yPos = 1;
    this.yPos = this.zoneBar.draw(this.yPos);
    lines.forEach((element) => this.drawLine(element));
    this.yPos += 3; // add some spacing here.

    this.buffer.draw( { delta: true } );
    
    // adds a callback to draw things
    var _this = this;
    setTimeout(function() { _this.draw(); }, TIMEOUT);
  }

  drawLine(line) {
    if (DEBUG) {
      console.log(line);
    }
    this.xPos = this.line_padding;
    for (let i = 0; i < line.length; i++) {
      var character = line.charAt(i);
      if (DEBUG) {
        console.log(`getting char: '${character}'`);
      }
      var characterSprite = this.sprites[character];
      if (characterSprite) {
        var characterSprite = this.sprites[character];
        characterSprite.draw({
          dst: this.buffer,
          x: this.xPos,
          y: this.yPos,
        });
        this.xPos += characterSprite.width;
      } else {
        this.xPos += this.sprites['A'].width;
      }
    }
    this.yPos += this.sprites['A'].height;
  }
}

