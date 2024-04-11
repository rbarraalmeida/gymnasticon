import { ScreenBuffer } from "terminal-kit";

const ZONES = [
    {id: 1, start: 0, finish: 56, fgColor: 255, bgColor: 248, lightBgColor: 251}, // gray
    {id: 2, start: 56, finish: 76, fgColor: 255, bgColor: 86, lightBgColor: 49}, // blue
    {id: 3, start: 76, finish: 91, fgColor: 255, bgColor: 82, lightBgColor: 58}, // green
    {id: 4, start: 91, finish: 106, fgColor: 255, bgColor: 44, lightBgColor: 32}, // yellow
    {id: 5, start: 106, finish: 121, fgColor: 255, bgColor: 237, lightBgColor: 78}, // orange
    {id: 6, start: 121, finish: 150, fgColor: 255, bgColor: 65, lightBgColor: 41}, // red
    {id: 7, start: 150, finish: 200, fgColor: 255, bgColor: 160, lightBgColor: 136}  // purple
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
    _this = this;
    ZONES.forEach((zoneToDraw) => {
        _this.xPos = _this.drawZone(zoneToDraw, _this.xPos, yPos)});
  }

  drawZone(zoneToDraw, xPos, yPos) {
    if (zoneToDraw.id === this.zone.id) {
        // current Zone
        var spaceForCurrentZone = this.width - (ZONES.length - 1); 

    } else if (Math.abs(zoneToDraw.id - this.zone.id) == 1) {
        // next zone
        this.buffer.fill( 
            { attr: { bgColor: zoneToDraw.bgColor, fgColor: zoneToDraw.fgColor} , 
              region: { x: xPos , y: yPos + 1, width: 1, height: 2} });
        xPos++;
    } else {
        // far away zone
        this.buffer.fill( 
            { attr: { bgColor: zoneToDraw.bgColor, fgColor: zoneToDraw.fgColor} , 
              region: { x: xPos , y: yPos + 2, width: 1, height: 1} });
        xPos++;
    }
    return xPos;
  }
}

/**
 * 
 * @param {number} power_perc 
 */
function getZone(power_perc) {
  var zone;
  
  zone = ZONES[ZONES.length - 1]; // defaults to purple.
  for (let i = 0; i < ZONES.length - 1; i++) {
    if (power_perc < ZONES[i].finish &&
        power_perc >= ZONES[i].start) {
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
    var soFar = 1.0; // Handles the last zone.
    if (length > 0) {
      soFar = power_perc - zone.start;
    }

    return soFar/length;
}
  