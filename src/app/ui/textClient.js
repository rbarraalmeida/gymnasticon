import { Palette } from "terminal-kit";
import { ZoneBar } from "./zoneBar";

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

  build() {
    var _this = this;
    termkit.getDetectedTerminal( function( error , detectedTerm ) {
		
      if ( error ) { throw new Error( 'Cannot detect terminal.' ) ; }
      
      _this.term = detectedTerm ;
      var palette = new Palette();
      palette.generate();
      _this.term.fullscreen();
      if (!DEBUG) {
        _this.term.hideCursor();
      }
  
      _this.buffer = new termkit.ScreenBuffer( 
        { dst: _this.term , 
          width: Math.max(_this.term.width, 40), 
          height: Math.max(_this.term.height, 40),
          delta: true,
          palette: palette,
        }) ;
  
      _this.zoneBar = new ZoneBar(this.term, this.riderFtp);
      _this.zoneBar.build();
    
      CHARACTERS.forEach((element) => _this.loadSprite(element));
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
    if (!this.term) return;
    this.zoneBar.updatePower(this.power);

    var lines = [];
    var power_perc = this.zoneBar.getPowerPerc();
    
    lines.push(`${CADENCE_LABEL} ${this.pad(this.cadence, 4)}`);
    lines.push(`${SPEED_LABEL} ${this.pad(this.speed, 4)}`);
    lines.push(`${POWER_LABEL} ${this.pad(this.power, 4)}`);
    lines.push(`${POWER_PERC_LABEL} ${this.pad(power_perc.toFixed(0), 4)}`);

    this.buffer.clear();
    this.buffer.fill({ attr: { bgColor: 'black' }});
    this.yPos = 1;
    lines.forEach((element) => this.drawLine(element));
    this.yPos += 3; // add some spacing here.

    this.zoneBar.draw(this.yPos);
            
    this.buffer.draw();
    
    // adds a callback to draw things
    var _this = this;
    setTimeout(function() { _this.draw(); }, 50);
  }

  drawLine(line) {
    if (DEBUG) {
      console.log(line);
    }
    this.xPos = 1;
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

