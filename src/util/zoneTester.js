#!/usr/bin/env node
"use strict" ;

import { ZoneBar } from '../app/ui/zoneBar';
import { ZONES } from '../app/ui/zoneBar';
import { Palette } from "terminal-kit";

const termkit = require('terminal-kit');
const FRAME_CHANGE = 10;
var term ;
var ScreenBuffer = termkit.ScreenBuffer ;
var power = 0;
var continuousMode = true;
var viewport, zoneBar;

function init( callback )
{
	termkit.getDetectedTerminal( function( error , detectedTerm ) {
		
		if ( error ) { throw new Error( 'Cannot detect terminal.' ) ; }
		
		term = detectedTerm ;
        var palette = new Palette();
    
		viewport = new ScreenBuffer( {
			dst: term ,
			width: Math.min( term.width ) ,
			height: Math.min( term.height) - 1,
            y: 2,
            palette: palette,
		} ) ;
				
		term.fullscreen() ;
		term.hideCursor() ;
		term.grabInput() ;
		term.on( 'key' , inputs ) ;
        zoneBar = new ZoneBar(viewport, 200);
        zoneBar.build();

        callback() ;
	} ) ;
}



function terminate()
{
	term.fullscreen( false ) ;
	term.hideCursor( false ) ;
	term.grabInput( false ) ;
	
	setTimeout( function() {
		term.moveTo( 1 , term.height , '\n\n' ) ;
		process.exit() ;
	} , 100 ) ;
}

function inputs( key )
{
	switch ( key )
	{
		case 'UP' :
        case 'RIGHT' :
            power += 5;
 			break ;
		case 'DOWN' :
        case 'LEFT' :
            power = Math.max(0, power - 5);
 			break ;
 		case 'q':
		case 'CTRL_C':
			terminate() ;
			break ;
	}
    continuousMode = false;
}

var frames = 0 ;

function draw()
{
    term.styleReset();
	term.moveTo.eraseLine.bgWhite.green( 1 , 1 , 'Power: %d, percentage (ftp): %f, frame: %d\n' , power, power_perc, frames);
    viewport.fill({ attr: { bgColor: 'black', fgColor: 'white' }});
    var power_perc = 0;
    if (zoneBar) {
      zoneBar.updatePower(power);
      power_perc = zoneBar.getPowerPerc();
      zoneBar.draw(2);
    } 
	

    var xPos = 1;
    viewport.moveTo(xPos, 10);
    ZONES.forEach((zone) => {
        viewport.put(
            { x: xPos++, attr: { bgColor: zone.bgColor, fgColor: zone.fgColor}} , `${zone.id}`);
        viewport.put(
            { x: xPos++, attr: { bgColor: zone.lightBgColor, fgColor: zone.fgColor}} , `${zone.id}`); 
     
    });
    var stats = viewport.draw( { delta: true } ) ;
	
	
	frames ++ ;
   
    if (frames % FRAME_CHANGE === 0 && continuousMode) {
        power += 5
    }
}

function animate()
{
    draw() ;
	setTimeout( animate , 50 ) ;
}

init( function() {
	animate() ;
} ) ;