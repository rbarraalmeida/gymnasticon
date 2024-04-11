

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
    this.term = termkit.terminal;
    this.term.fullscreen();
    if (!DEBUG) {
      this.term.hideCursor();
    }


    this.buffer = new termkit.ScreenBuffer( 
      { dst: this.term , 
        width: Math.max(this.term.width - 1, 40), 
        height: Math.max(this.term.height -1, 40),
        delta: true}) ;

    CHARACTERS.forEach((element) => this.loadSprite(element));

    this.draw();
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
    var lines = [];
    var power_perc = Math.round((this.power * 1000.0) / this.riderFtp)/10;
    var zoneColor = 5; // Purple
    var intoZone = 1.0;
    if (power_perc < 56) {
      zoneColor = 8;
      intoZone = power_perc/55;
    } else if (power_perc < 76) {
      zoneColor = 'blue';
      intoZone = (power_perc - 55)/(75 - 55);
    } else if (power_perc < 91) {
      zoneColor = 'green';
      intoZone = (power_perc - 75)/(90 - 75);
    } else if (power_perc < 106) {
      zoneColor = 'yellow';
      intoZone = (power_perc - 90)/(105 - 90);
    } else if (power_perc < 121) {
      zoneColor = 3; // Orange -> Olive
      intoZone = (power_perc - 105)/(120 - 105);
    } else if (power_perc < 151) {
      zoneColor = 'red';
      intoZone = (power_perc - 120)/(150 - 120);
    }

    lines.push(`${CADENCE_LABEL}      ${this.pad(this.cadence, 3)}`);
    lines.push(`${SPEED_LABEL}     ${this.pad(this.speed, 4)}`);
    lines.push(`${POWER_LABEL}      ${this.pad(this.power, 3)}`);
    lines.push(`${POWER_PERC_LABEL}    ${this.pad(power_perc.toFixed(0), 5)}`);

    this.buffer.clear();
    this.buffer.fill({ attr: { bgColor: 'black' }});
    this.yPos = 1;
    lines.forEach((element) => this.drawLine(element));
    this.yPos += 3; // add some spacing here.

    var remainingHeight = Math.min(this.buffer.height - this.yPos, 3);
    var xFullPos = Math.round(this.buffer.width * intoZone);
    this.buffer.fill( 
      { attr: { bgColor: zoneColor } , 
        region: { x: 1 , y: this.yPos , width: xFullPos, height: remainingHeight } } ) ;
    if (xFullPos < this.buffer.width) {
        this.buffer.fill( 
          { attr: { bgColor: 7 } , // lighy gray
            region: { x: xFullPos , y: this.yPos , width: this.buffer.width - xFullPos, height: remainingHeight } } ) ;
    }
            
    if (!DEBUG) {
      this.buffer.draw();
    } else{
      console.log(`into zone: ${intoZone}`)
      console.log(`remaining Height: ${remainingHeight}`);
      console.log(`yPos: ${this.yPos}`)
      console.log(`xFullPos: ${xFullPos}`)
    }

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
        this.xPos += this.sprites['A'].width - 3;
      }
    }
    this.yPos += this.sprites['A'].height;
  }
}

