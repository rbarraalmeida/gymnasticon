
export class TextClient {
  /**
   * Create a TextClient instance.
   * @param {number} riderFtp - the ftp for the participant.
   */
  constructor(riderFtp) {
    this.riderFtp = riderFtp;
  }


  create() {
    this.blessed = require('blessed');

    this.screen = this.blessed.screen({
      smartCSR: true,
      dockBorders: true,
    });

    this.screen.title = 'Gymnasticon';

    // Create a box perfectly centered horizontally and vertically.
    var box = blessed.box(
        {
          top: 'center',
          left: 'center',
          width: '50%',
          height: '50%',
          content: 'Hello {bold}world{/bold}!',
          tags: true,
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
  }

  update(cadence, speed, power) {
    this.screen.render();
  }
}