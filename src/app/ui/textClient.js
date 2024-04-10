

const CADENCE_LABEL = "CAD";
const SPEED_LABEL = "VEL";
const POWER_LABEL = "POT";
const POWER_PERC_LABEL = "POR";

export class TextClient {
  /**
   * Create a TextClient instance.
   * @param {number} riderFpt - the ftp for the rider
   */
  constructor(riderFpt) {
    this.riderFpt = riderFpt;
    this.cadence = 0;
    this.speed = 0;
    this.power = 0;
  }

  build() {
    this.term = require('terminal-kit').terminal;
    
    this.draw();
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
   * Logs information
   */

  draw() {
    var lines = [];
    var power_perc = ((this.power * 100) / this.riderFpt).toFixed(0);
    lines.push(`${CADENCE_LABEL}    ${this.cadence}`);
    lines.push(`${SPEED_LABEL}   ${this.speed}`);
    lines.push(`${POWER_LABEL}    ${this.power}`);

    console.log("\n\n\n\nStarting to draw");
    lines.forEach((element) => console.log(`${element}\n`));

    // adds a callback to draw things
    var _this = this;
    setTimeout(function() { _this.draw(); }, 50);
  }
}

