export class TextClient {
  /**
   * Create a TextClient instance.
   * @param {number} riderFtp - the ftp for the participant.
   */
  constructor(riderFtp) {
    this.riderFtp = riderFtp;
  }

  create() {
    var blessed = require('blessed'), contrib = require('blessed-contrib');

    this.screen = blessed.screen({
      smartCSR: true,
    });

    this.screen.title = 'Gymnasticon';

    this.cadenceDisplay = contrib.lcd({
        label: 'Cadence RPM',
        elements: 3
    });
    this.screen.append(this.cadenceDisplay);

    this.speedDisplay = contrib.lcd({
        label: 'Speed (Km/h)',
        elements: 4
    });
    this.screen.append(this.speedDisplay);

    this.powerDisplay = contrib.lcd({
        label: 'Power (Watts)',
        elements: 3
    });
    this.screen.append(this.powerDisplay);

    this.relativePowerDisplay = contrib.lcd({
        label: 'FTP %',
        elements: 3
    });
    this.screen.append(this.relativePowerDisplay);
  }

  update(cadence, speed, power) {
    this.cadenceDisplay.setDisplay(cadence);
    this.speedDisplay.setDisplay(speed);
    this.powerDisplay.setDisplay(power);
    var relativePower = ((power * 100) / this.riderFtp).toFixed(0);
    this.relativePowerDisplay.setDisplay(relativePower);
    this.screen.render();
  }
}
