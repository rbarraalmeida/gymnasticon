import {blessed} from "blessed"
import {contrib} from "blessed-contrib"

export class TextClient {
  /**
   * Create a TextClient instance.
   * @param {number} riderFtp - the ftp for the participant.
   */
  constructor(riderFtp) {
    this.riderFtp = riderFtp;
  }

  create() {
    this.screen = blessed.screen({
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

    this.screen.append(box);
    this.screen.render();
  }

  update(cadence, speed, power) {
    //this.screen.render();
  }
}
