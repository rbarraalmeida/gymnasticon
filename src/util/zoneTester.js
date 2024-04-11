#!/usr/bin/env node
"use strict" ;

import { ZoneBar } from '../app/ui/zoneBar';

const termkit = require('terminal-kit');
var term ;
var ScreenBuffer = termkit.ScreenBuffer ;
var power = 0;

var viewport, zoneBar;

function init( callback )
{
	termkit.getDetectedTerminal( function( error , detectedTerm ) {
		
		if ( error ) { throw new Error( 'Cannot detect terminal.' ) ; }
		
		term = detectedTerm ;
		
		viewport = new ScreenBuffer( {
			dst: term ,
			width: Math.min( term.width ) ,
			height: Math.min( term.height) - 1,
            y: 2
		} ) ;
				
		term.fullscreen() ;
		term.hideCursor() ;
		term.grabInput() ;
		term.on( 'key' , inputs ) ;
        callback() ;

        zoneBar = new ZoneBar(viewport, 200);
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
            power = Math.max(0, perc - 5);
 			break ;
 		case 'q':
		case 'CTRL_C':
			terminate() ;
			break ;
	}
}

var frames = 0 ;

function draw()
{
	sprites.background.draw( { dst: viewport , tile: true } ) ;
	sprites.spaceship.draw( { dst: viewport , blending: true , wrap: 'both' } ) ;
	var stats = viewport.draw( { delta: true } ) ;
	//var stats = viewport.draw() ;
	
	term.moveTo.eraseLine.bgWhite.green( 1 , 1 , 'Power: %d\n' , power) ;
	
	frames ++ ;
}

function animate()
{
	if (zoneBar) zoneBar.draw(power);
    draw() ;
	setTimeout( animate , 50 ) ;
}

init( function() {
	animate() ;
} ) ;