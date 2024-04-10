

const CADENCE_LABEL = "CAD";
const SPEED_LABEL = "VEL";
const POWER_LABEL = "POT";
const POWER_PERC_LABEL = "POR";
const SPRITE_DIR = "/home/pi/gymnasticon/lib/datagen/data/";
const CHARACTERS = ['0', '1', '2', '3', 
    '4', '5', '6', '7', '8', '9', '.',
    'A', 'C', 'D', 'E', 'L', 'P', 
    'R', 'T', 'V'];

const termkit = require('terminal-kit');

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
    this.term.hideCursor();

    this.buffer = new termkit.ScreenBuffer( 
      { dst: this.term , 
        width: Math.max(this.term.width - 1, 40), 
        height: Math.max(this.term.height -1, 40)}) ;

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

  /**
   * Draws the UI.
   */
  draw() {
    var lines = [];
    var power_perc = Math.round((this.power * 1000.0) / this.riderFtp)/10;
    lines.push(`${CADENCE_LABEL}    ${this.cadence}`);
    lines.push(`${SPEED_LABEL}   ${this.speed}`);
    lines.push(`${POWER_LABEL}    ${this.power}`);
    lines.push(`${POWER_PERC_LABEL}    ${power_perc.toFixed(0)}`);

    this.buffer.fill({ attr: { bgColor: 'black' }});
    this.yPos = 1;
    lines.forEach((element) => this.drawLine(element));

    var zoneColor = 'purple';
    if (power_perc <= 55) {
      zoneColor = 'gray';
    } else if (power_perc <= 75) {
      zoneColor = 'blue';
    } else if (power_perc <= 89) {
      zoneColor = 'green';
    } else if (power_perc <= 105) {
      zoneColor = 'yellow';
    } else if (power_perc <= 105) {
      zoneColor = 'orange';
    } else if (power_perc <= 125) {
      zoneColor = 'red';
    }
    var remainingHeight = this.buffer.height - this.yPos;
    this.buffer.fill( 
      { attr: { bgColor: zoneColor } , 
        region: { x: 1 , y: this.yPos , width: this.buffer.width, height: remainingHeight } } ) ;

    this.buffer.draw();
    // adds a callback to draw things
    var _this = this;
    setTimeout(function() { _this.draw(); }, 50);
  }

  drawLine(line) {
    this.xPos = 1;
    line.forEach((character) => {
      if (this.sprites.has(character)) {
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
    });
    this.yPos += this.sprites['A'].height;
  }
}

