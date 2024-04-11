#!/usr/bin/env node
"use strict";

const termkit = require('terminal-kit');
const term = termkit.terminal;
const fs = require('fs');

const WHITE_IN_BLACK = { attr: { color: 'white' , bgColor: 'black' },
                         transparencyChar: '#'};
const RED_IN_BLACK = { attr: { color: 'red' , bgColor: 'black' },
                       transparencyChar: '#'};
const INPUT_DIR = 'src/datagen/data/';
const OUTPUT_DIR = 'lib/datagen/data/';

var xPos = 1;
var yPos = 1;

const numbers = ['0', '1', '2', '3', 
    '4', '5', '6', '7', '8', '9', '.'];

const letters = ['A', 'C', 'D', 'E', 'L', 'P', 
    'R', 'T', 'V', 'O'];

term.fullscreen();
term.hideCursor();
var buffer = new termkit.ScreenBuffer( { dst: term , 
    width: Math.max(term.width - 1, 40), 
    height: Math.max(term.height -1, 40) } ) ;
buffer.fill( { attr: { bgColor: 'cyan' } } ) ;
buffer.fill( { attr: { bgColor: 'brightMagenta' } , region: { x: 3 , y: 2 , width: 3 , height: 3 } } ) ;
numbers.forEach((element)=> generateCharacter(element, RED_IN_BLACK));
letters.forEach((element)=> generateCharacter(element, WHITE_IN_BLACK));
buffer.draw() ;

term( '\n' ) ;

function generateCharacter(element, color) {
  var inputFilename = INPUT_DIR + element + ".txt";
  var outputFilename = OUTPUT_DIR + element + ".sbuf";

  var characterSprite = termkit.ScreenBuffer.createFromChars(color, fs.readFileSync(inputFilename));
  characterSprite.saveSync(outputFilename);
  characterSprite.x = xPos;
  characterSprite.y = yPos;
  characterSprite.draw({dst: buffer});
  xPos += characterSprite.width;
  if (xPos > 40) {
    xPos = 1;
    yPos += characterSprite.height;
  }
}
