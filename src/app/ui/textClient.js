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

    this.cadenceDisplay = blessed.bigtext({
        content: '',
        border: {
          type: 'line'
        },
        style: {
          fg: 'white',
          bg: 'magenta',
          border: {
            fg: '#f0f0f0'
          },
          hover: {
            bg: 'green'
          }
        }
    });
    this.screen.append(this.cadenceDisplay);

    this.speedDisplay =  blessed.bigtext({
        content: '',
        border: {
          type: 'line'
        },
        style: {
          fg: 'white',
          bg: 'magenta',
          border: {
            fg: '#f0f0f0'
          },
          hover: {
            bg: 'green'
          }
        }
    });
    this.screen.append(this.speedDisplay);

    this.powerDisplay =  blessed.bigtext({
        content: '',
        border: {
          type: 'line'
        },
        style: {
          fg: 'white',
          bg: 'magenta',
          border: {
            fg: '#f0f0f0'
          },
          hover: {
            bg: 'green'
          }
        }
    });
    this.screen.append(this.powerDisplay);

    this.relativePowerDisplay =  blessed.bigtext({
        content: '',
        border: {
          type: 'line'
        },
        style: {
          fg: 'white',
          bg: 'magenta',
          border: {
            fg: '#f0f0f0'
          },
          hover: {
            bg: 'green'
          }
        }
    });
    this.screen.append(this.relativePowerDisplay);
  }

  update(cadence, speed, power) {
    this.cadenceDisplay.setContent(cadence);
    this.speedDisplay.setContent(speed);
    this.powerDisplay.setContent(power);
    var relativePower = ((power * 100) / this.riderFtp).toFixed(0);
    this.relativePowerDisplay.setCOntent(relativePower);
    this.screen.render();
  }
}
