


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

  draw() {
    console.log(`speed ${this.speed} cadence ${this.cadence} power ${this.power} FTP ${this.ftp}`);

    // adds a callback to draw things
    var _this = this;
    setTimeout(function() { _this.draw(); }, 50);
  }
}

