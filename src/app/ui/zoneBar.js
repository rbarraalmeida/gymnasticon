import { ScreenBuffer } from "terminal-kit";

export const ZONES = [
    {id: 1, start:   0, finish:  56, color: 15, lightColor: 15, bgColor: 247, lightBgColor: 250, name: "Active Recovery"}, // gray
    {id: 2, start:  56, finish:  76, color:  0, lightColor:  0, bgColor:  85, lightBgColor:  48, name: "Endurance"}, // blue
    {id: 3, start:  76, finish:  91, color: 15, lightColor: 15, bgColor:  81, lightBgColor:  57, name: "Tempo"}, // green
    {id: 4, start:  91, finish: 106, color:  0, lightColor:  0, bgColor:  43, lightBgColor: 102, name: "Lactate Threshold"}, // yellow
    {id: 5, start: 106, finish: 121, color:  0, lightColor:  0, bgColor: 236, lightBgColor:  29, name: "Vo2 Max"}, // orange
    {id: 6, start: 121, finish: 150, color: 15, lightColor: 15, bgColor:  64, lightBgColor:  40, name: "Anaerobic Capacity"}, // red
    {id: 7, start: 150, finish: 200, color: 15, lightColor:  0, bgColor: 159, lightBgColor: 135, name: "Neuromuscular Power"}  // purple
];

// 254 - white - 15
// 247 - black - 0
const CUR_ZONE_HEIGHT = 3;
const NEXT_ZONE_HEIGHT = 3;
const FAR_ZONE_HEIGHT = 3;
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
    this.xPos = 0;
  }

  build() {
    this.buffer = ScreenBuffer.create( {
        dst: this.container, 
        width: this.container.width - 2,
        height: CUR_ZONE_HEIGHT, 
        x: 1,
        palette: this.container.palette} ) ;
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
    //console.log(`\n\n\ndrawing a new bar width:${this.buffer.width} height:${this.buffer.height}`);
    this.buffer.y = yPos;
    this.buffer.fill(
        { attr: { bgColor: 0, color: 15},
          region: { x: 0, 
                    y: 0,
                    width: this.buffer.width,
                    height: this.buffer.height }}) ;
    var xPos = 0;
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
    //console.log(`\tdrawing zone: ${zoneToDraw.id} xPos: ${xPos}`);
    var mainAttrForZone = { bgColor: zoneToDraw.bgColor, color: zoneToDraw.color};
    if (zoneToDraw.id === this.zone.id) {
        //console.log(`\t\tisCurrent`);
        // current Zone
        var spaceForCurrentZone = buffer.width - (ZONES.length - 1) * ZONE_WIDTH;
        var finalDarkPos = Math.round(spaceForCurrentZone * this.intoZone); 
        buffer.fill(
            { attr: mainAttrForZone,
              region: { x: xPos, 
                        y: 0,
                        width: finalDarkPos,
                        height: CUR_ZONE_HEIGHT }}) ;
        //console.log(`\t\t\tsolid x:${xPos} y:0 width: ${finalDarkPos} height: ${CUR_ZONE_HEIGHT}`);
        var lightAttrForZone = { bgColor: zoneToDraw.lightBgColor, color: zoneToDraw.lightColor};
        buffer.fill( 
            { attr: lightAttrForZone,
            region: { x: xPos + finalDarkPos, 
                      y: 0, 
                      width: spaceForCurrentZone - finalDarkPos, 
                      height: CUR_ZONE_HEIGHT } } ) ;
        //console.log(`\t\t\tlight x:${xPos + finalDarkPos} y:0 width: ${spaceForCurrentZone - finalDarkPos} height: ${CUR_ZONE_HEIGHT}`);
        var label = `Zone ${zoneToDraw.id}: ${zoneToDraw.name}`;
        var charPos = xPos + Math.floor((spaceForCurrentZone - label.length)/2);
        buffer.moveTo(charPos, 1);
        label.split('').forEach((character) => {
          var charAttr;
          if (charPos < xPos + finalDarkPos) {
            charAttr = mainAttrForZone;
          } else{
            charAttr = lightAttrForZone;
          }  
          buffer.put({x:charPos, markup: true, attr: charAttr}, `^+^/${character}`);
          charPos++;
        });
        //buffer.put({x:charPos, markup: true, attr: mainAttrForZone}, `${label.length} ${Math.floor(label.length/2)}  ${xPos + Math.floor(spaceForCurrentZone/2) - Math.floor(label.lenght/2)}`);
        return xPos + spaceForCurrentZone;
    }
    
    // near or far zones
    var isNext = Math.abs(zoneToDraw.id - this.zone.id) === 1;
    //console.log(`\t\t` + (isNext ? 'isNext' : 'isFar'));
    var zoneHeight = isNext ? NEXT_ZONE_HEIGHT : FAR_ZONE_HEIGHT;
    buffer.fill( 
         { attr: mainAttrForZone,
            region: { x: xPos, 
                      y: CUR_ZONE_HEIGHT - zoneHeight, 
                      width: ZONE_WIDTH, 
                      height: zoneHeight}});
    //console.log(`\t\t\tsolid x:${xPos} y:${CUR_ZONE_HEIGHT - zoneHeight + 1} width: ${ZONE_WIDTH} height: ${zoneHeight}`);
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
    var soFar = power_perc - zone.start;
    if (soFar >= length) {
        return 1.0;
    }
    return soFar/length;
}
  