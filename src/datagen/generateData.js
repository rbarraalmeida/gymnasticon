#!/usr/bin/env node
"use strict";

const WHITE_IN_BLACK = { attr: { color: 'white' , bgColor: 'green' },
                         transparencyChar: '#'};
const RED_IN_BLACK = { attr: { color: 'red' , bgColor: 'green' },
                       transparencyChar: '#'};
const DIR = 'src/datagen/data/'
const Promise = require( 'seventh' ) ;

var fs = require('fs');
var ScreenBuffer = require('terminal-kit').ScreenBuffer;
var terminal = require('terminal-kit').terminal;
var term;

var numbers = ['0', '1', '2', '3', 
    '4', '5', '6', '7', '8', '9', '.'];

var letters = ['A', 'C', 'D', 'E', 'L', 'P', 
    'R', 'T', 'V'];

terminal.clear();
numbers.forEach((element)=> generateCharacter(element, RED_IN_BLACK));
letters.forEach((element)=> generateCharacter(element, WHITE_IN_BLACK));
 
async function generateCharacter(element, color) {
  var inputFilename = DIR + element + ".txt";
  var outputFilename = DIR + element + ".sbuf";

  //var characterSprite = new ScreenBuffer({
  //  width: 4,
  //  height: 6,
  //  noFill: true});

  var characterSprite = ScreenBuffer.createFromChars(color, fs.readFileSync(inputFilename));
  characterSprite.saveSync(outputFilename);
  
  characterSprite.draw({dst: terminal});
  await Promise.resolveTimeout( 500 ) ;
}
