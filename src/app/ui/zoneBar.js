import { ScreenBuffer } from "terminal-kit";

export class ZoneBar {
  /**
    * 
    * @param {ScreenBuffer} buffer 
    * @param {number} riderFtp;
    */
  constructor(buffer, riderFtp) {
    this.buffer = buffer;
    this.riderFtp = riderFtp;
  } 

  draw(power, yPos) {
    this.yPos = yPos;
    // TODO
  }
}
