#!/usr/bin/env node
"use strict";

const WHITE_IN_BLACK = { attr: { color: 'white' , bgColor: 'black' },
                         transparencyChar: '#'};
const RED_IN_BLACK = { attr: { color: 'red' , bgColor: 'black' },
                       transparencyChar: '#'};
const DIR = 'src/datagen/data/'

var fs = require('fs');
var ScreenBuffer = require('terminal-kit').ScreenBuffer;
var terminal = require('terminal-kit').terminal;
var term;

var numbers = ['0', '1', '2', '3', 
    '4', '5', '6', '7', '8', '9', '.'];

var letters = ['A', 'C', 'D', 'E', 'L', 'P', 
    'R', 'T', 'V'];

terminal.fullscreen() ;
terminal.hideCursor() ;
terminal.clear();
numbers.forEach((element)=> generateCharacter(element, RED_IN_BLACK));
letters.forEach((element)=> generateCharacter(element, WHITE_IN_BLACK));
 
var xPos = 1;
var yPos = 1;

function generateCharacter(element, color) {
  var inputFilename = DIR + element + ".txt";
  var outputFilename = DIR + element + ".sbuf";

  //var characterSprite = new ScreenBuffer({
  //  width: 4,
  //  height: 6,
  //  noFill: true});

  var characterSprite = ScreenBuffer.createFromChars(color, fs.readFileSync(inputFilename));
  characterSprite.saveSync(outputFilename);
  
  characterSprite.draw({dst: terminal, x: xPos, y: yPos});
  characterSprite.draw({dst: terminal, x: 50, y: 50});
  xPos += 4;
  if (xPos > 40) {
    xPos = 1;
    yPos += 7;
  }
}
