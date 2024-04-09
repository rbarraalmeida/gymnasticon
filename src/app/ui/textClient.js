
export class TextClient {
  /**
   * Create a TextClient instance.
   * @param {number} riderFtp - the ftp for the participant.
   */
  constructor(riderFtp) {
    super();
    this.riderFtp = riderFtp;
  }


  create() {
    this.blessed = require('blessed');

    this.screen = this.blessed.screen({
      smartCSR: true
    });
  }

  update(cadence, speed, power) {
    this.screen.render();
  }
}
