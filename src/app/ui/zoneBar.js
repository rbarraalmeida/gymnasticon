import { ScreenBuffer } from "terminal-kit";
import { Palette } from "terminal-kit";

const ZONES = [
    {id: 1, start: 0, finish: 56, fgColor: 254, bgColor: 247, lightBgColor: 250}, // gray
    {id: 2, start: 56, finish: 76, fgColor: 254, bgColor: 85, lightBgColor: 48}, // blue
    {id: 3, start: 76, finish: 91, fgColor: 254, bgColor: 81, lightBgColor: 57}, // green
    {id: 4, start: 91, finish: 106, fgColor: 254, bgColor: 43, lightBgColor: 31}, // yellow
    {id: 5, start: 106, finish: 121, fgColor: 254, bgColor: 236, lightBgColor: 77}, // orange
    {id: 6, start: 121, finish: 150, fgColor: 254, bgColor: 64, lightBgColor: 40}, // red
    {id: 7, start: 150, finish: 200, fgColor: 254, bgColor: 159, lightBgColor: 135}  // purple
];
const CUR_ZONE_HEIGHT = 3;
const NEXT_ZONE_HEIGHT = 2;
const FAR_ZONE_HEIGHT = 1;
const ZONE_WIDTH = 2;

export class ZoneBar {
  /**
    * 
    * @param {ScreenBuffer} container 
    * @param {number} riderFtp;
    */
  constructor(container, riderFtp) {
    this.container = container;
    this.riderFtp = riderFtp;
    this.xPos = 2;
  }

  build() {
    this.palette = new Palette() ;
    //this.palette.generate() ;
    this.buffer = ScreenBuffer.create( {
        dst: this.container, 
        width: this.container.width - 2,
        height: CUR_ZONE_HEIGHT, 
        x: 1, 
        palette: this.palette } ) ;
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
    console.log("\n\n\ndrawing a new bar");
    this.buffer.y = yPos;
    this.buffer.clear();
    var xPos = 1;
    var _this = this;
    ZONES.forEach((zoneToDraw) => {
        xPos = _this.drawZone(_this.buffer, zoneToDraw, xPos)});

    this.buffer.draw();
  }

  /**
   * 
   * @param {ScreenBuffer} buffer 
   * @param {*} zoneToDraw 
   * @param {*} xPos 
   * @returns 
   */
  drawZone(buffer, zoneToDraw, xPos) {
    console.log(`\tdrawing zone: ${zoneToDraw.id} xPos: ${xPos}`);
    var mainAttrForZone = { bgColor: zoneToDraw.bgColor, fgColor: zoneToDraw.fgColor};
    if (zoneToDraw.id === this.zone.id) {
        console.log(`\t\tisCurrent`);
        // current Zone
        var spaceForCurrentZone = buffer.width - (ZONES.length - 1) * ZONE_WIDTH;
        var finalDarkPos = spaceForCurrentZone * this.intoZone; 
        buffer.fill(
            { attr: mainAttrForZone,
              region: { x: xPos, 
                        y: 1,
                        width: finalDarkPos,
                       height: CUR_ZONE_HEIGHT }}) ;
        console.log(`\t\t\tsolid x:${xPos} y:1 width: ${finalDarkPos} height: ${CUR_ZONE_HEIGHT}`);
        var lightAttrForZone = { bgColor: zoneToDraw.lightBgColor, fgColor: zoneToDraw.fgColor};
        buffer.fill( 
            { attr: lightAttrForZone,
            region: { x: finalDarkPos + 1, 
                      y: 1, 
                      width: spaceForCurrentZone - finalDarkPos, 
                      height: CUR_ZONE_HEIGHT } } ) ;
        console.log(`\t\t\tlight x:${finalDarkPos + 1} y:1 width: ${spaceForCurrentZone - finalDarkPos} height: ${CUR_ZONE_HEIGHT}`);
        return xPos + spaceForCurrentZone;
    }
    
    // near or far zones
    var isNext = Math.abs(zoneToDraw.id - this.zone.id) === 1;
    if (isNext) {
        console.log(`\t\tisNext`);
    } else {
        console.log(`\t\tisFar`);
    }
    var zoneHeight = isNext ? NEXT_ZONE_HEIGHT : FAR_ZONE_HEIGHT;
    buffer.fill( 
         { attr: mainAttrForZone,
            region: { x: xPos , 
                      y: CUR_ZONE_HEIGHT - zoneHeight + 1, 
                      width: ZONE_WIDTH, 
                      height: zoneHeight}});
    console.log(`\t\t\tsolid x:${xPos} y:${CUR_ZONE_HEIGHT - zoneHeight + 1} width: ${ZONE_WIDTH} height: ${zoneHeight}`);
    xPos += ZONE_WIDTH;
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
  