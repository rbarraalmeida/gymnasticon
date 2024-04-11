import { ScreenBuffer } from "terminal-kit";

const ZONES = [
    {id: 1, start: 0, finish: 56},
    {id: 2, start: 56, finish: 76},
    {id: 3, start: 76, finish: 91}, 
    {id: 4, start: 91, finish: 106}, 
    {id: 5, start: 106, finish: 121},
    {id: 6, start: 121, finish: 150},
    {id: 7, start: 150, finish: 1000}
];

export class ZoneBar {
  /**
    * 
    * @param {ScreenBuffer} buffer 
    * @param {number} riderFtp;
    */
  constructor(buffer, riderFtp) {
    this.buffer = buffer;
    this.riderFtp = riderFtp;
    this.width = buffer.width - 2;
    this.xPos = 2;
  } 

  updatePower(power) {
    this.power = power;
    this.power_perc = (this.power * 100.0) / this.riderFtp;
    
    this.zone = getZone(this.power_perc);
    this.intoZone = getIntoZone(this.zone, this.power_perc);
  }

  getPowerPerc() {
    return this.power_perc.toFixed(0);
  }

  draw(yPos) {
    this.yPos = yPos;
    ZONES.forEach((zone) => this.yPos = this.drawZone(zoneToDraw, this.yPos));
  }

  drawZone(zoneToDraw, yPos) {
    if (zoneToDraw.id === this.zone.id) {
        // current Zone
        var spaceForCurrentZone = this.width - (ZONES.length - 1); 

    } else if (Math.abs(zoneToDraw.id - this.zone.id) == 1) {
        // next zone
    } else {
        // far away zone
    }
    return yPos;
  }
}

/**
 * 
 * @param {number} power_perc 
 */
function getZone(power_perc) {
  var zone;
  
  for (let i = 0; i < ZONES.length; i++) {
    if (power_perc < ZONES[i].finish) {
      zone = ZONES[i];
      break;
    }
  }
  return zone;
}

/**
 * 
 * @param {number} power_perc 
 * @returns {number}
 */
function getIntoZone(zone, power_perc) {
    var length = zone.finish - zone.start;
    var soFar = power_perc - zone.start;

    return soFar/length;
}
  