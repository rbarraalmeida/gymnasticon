#!/usr/bin/env node
"use strict";

const WHITE_IN_BLACK = { attr: { color: 'white' , bgColor: 'black' },
                         transparencyChar: '#'};
const RED_IN_BLACK = { attr: { color: 'red' , bgColor: 'black' },
                       transparencyChar: '#'};
const DIR = 'src/datagen/data/'

var fs = require('fs');
var termkit = require('termkit');
var term;
var ScreenBuffer = termkit.ScreenBuffer;

var numbers = ['0', '1', '2', '3', 
    '4', '5', '6', '7', '8', '9', '.'];

var letters = ['A', 'C', 'D', 'E', 'L', 'P', 
    'R', 'T', 'V'];

numbers.forEach((element)=> generateCharacter(element, RED_IN_BLACK));
letters.forEach((element)=> generateCharacter(element, WHITE_IN_BLACK));


generateCharacter(element, color) {
  var inputFilename = DIR + element + ".txt";
  var outputFilename = DIR + element + ".sbuf";

  var characterSprite = new ScreenBuffer({
    width: 4,
    height: 6,
    noFill: true});

  characterSprite.createFromChars(color, fs.readFileSync(inputFilename));
  characterSprite.saveSyncV2(outputFilename);
}
