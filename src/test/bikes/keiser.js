import test from 'tape';
import {bikeVersion} from '../../bikes/keiser';
import {calcPowerToSpeed} from '../../bikes/keiser';
import {calcDistanceDurationToSpeed} from '../../bikes/keiser';
import {parse} from '../../bikes/keiser'

/**
 * See https://dev.keiser.com/mseries/direct/#data-parse-example for a
 * data parse example of the below test case
 */

test('parse() parses Keiser indoor bike data values - speed from power', t => {
  const buf = Buffer.from('0201063000383803460573000D00042701000A', 'hex');
  const {type, payload: {power, cadence, speed}} = parse(buf, 0);
  t.equal(type, 'stats', 'message type');
  t.equal(power, 115, 'power (watts)');
  t.equal(cadence, 82, 'cadence (rpm)');
  t.equal(speed, '27.6', 'speed (km/h)');
  t.end();
});

test('parse() parses Keiser indoor bike data values - speed from distance', t => {
  const buf = Buffer.from('0201063000383803460573000D00042701000A', 'hex');
  const {type, payload: {power, cadence, speed}} = parse(buf, 1);
  t.equal(type, 'stats', 'message type');
  t.equal(power, 115, 'power (watts)');
  t.equal(cadence, 82, 'cadence (rpm)');
  t.equal(speed, '2.1', 'speed (km/h)');
  t.end();
});

test('bikeVersion() Tests Keiser bike version (6.40)', t => {
  const bufver = Buffer.from('0201064000383803460573000D00042701000A', 'hex');
  const {version, timeout} = bikeVersion(bufver);
  t.equal(version, '6.40', 'Version: 6.40');
  t.equal(timeout, 2, 'Timeout: 2 second');
  t.end();
});

test('bikeVersion() Tests Keiser bike version (6.30)', t => {
  const bufver = Buffer.from('0201063000383803460573000D00042701000A', 'hex');
  const {version, timeout} = bikeVersion(bufver);
  t.equal(version, '6.30', 'Version: 6.30');
  t.equal(timeout, 2, 'Timeout: 2 second');
  t.end();
});

test('bikeVersion() Tests Keiser bike version (6.22)', t => {
  const bufver = Buffer.from('0201062200383803460573000D00042701000A', 'hex');
  const {version, timeout} = bikeVersion(bufver);
  t.equal(version, '6.22', 'Version: 6.22');
  t.equal(timeout, 7, 'Timeout: 7 second');
  t.end();
});

test('bikeVersion() Tests Keiser bike version (5.12)', t => {
  const bufver = Buffer.from('0201051200383803460573000D00042701000A', 'hex');
  const {version, timeout} = bikeVersion(bufver);
  t.equal(version, '5.12', 'Version: 5.12');
  t.equal(timeout, 7, 'Timeout: 7 second');
  t.end();
});

test('calcPowerToSpeed ', t => {
  t.equal(calcPowerToSpeed(115), '27.6', 'speed from 115 watts');
  t.equal(calcPowerToSpeed(233.6), '36.2', 'speed from 233.6 watts');
  t.equal(calcPowerToSpeed(0), '0.1', 'speed from 0 watts');
  t.end();
});

test('calcDistanceDurationToSpee ', t => {
  t.equal(calcDistanceDurationToSpeed(10, 1000), '5.8', 'distance = 1 miles, duration = 1000 seconds');
  t.equal(calcDistanceDurationToSpeed(-125, 30 * 60), '25.0', 'distance = 12.5 kilometers, duration = 30 minutes');
  t.end();
});
