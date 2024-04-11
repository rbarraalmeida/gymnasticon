#!/usr/bin/env node

import yargs from 'yargs';
import {App} from './app';
import {options} from './cli-options';
import {version} from '../../package.json';

const banner = String.raw`
   __o  
 _ \<_  
(_)/(_) 

Gymnasticon
v${version}
`

const argv = yargs
  .usage(`${banner}\nusage: gymnasticon [OPTIONS]`)
  .config()
  .options(options)
  .help()
  .version()
  .alias('h', 'help')
  .argv;

(async () => {
  var fs = require('fs');
  var util = require('util');
  var log_file = fs.createWriteStream('./debug.log', {flags : 'w'});

  console.log = function(d) { //
    log_file.write(util.format(d) + '\n');
  };
  const app = new App(argv);
  await app.run();
})();
