import {test} from 'tape';
import {updateValue} from '../../../app/ui/textClient';

test('equal values', t => {
    let value = updateValue(10, 10, 1);
    t.equal(value, 10, 'integer value');
    value = updateValue(10.3, 10.3, 1);
    t.equal(value, 10.3, 'float value');
    value = updateValue("10", "10", 1);
    t.equal(value, 10, 'string value');
  });

test('Smaller increasing values', t => {
    let value = updateValue(10, 13, 1);
    t.equal(value, 11, 'integer value');
    value = updateValue(10.3, 13.3, 1.7);
    t.equal(value, 12.0, 'float value');
    value = updateValue("10", "13", 1);
    t.equal(value, 11, 'string value');
  });

test('Larger increasing values', t => {
    let value = updateValue(10, 13, 5);
    t.equal(value, 13, 'integer value');
    value = updateValue(10.0, 13.0, 5);
    t.equal(value, 13.0, 'float value');
    value = updateValue("10", "13", 5);
    t.equal(value, 13, 'string value');
  });

test('Smaller decreasing values', t => {
    let value = updateValue(10, 8, 1);
    t.equal(value, 9, 'integer value');
    value = updateValue(10.0, 7.9, 1);
    t.equal(value, 9.0, 'float value');
    value = updateValue("10", "8", 1);
    t.equal(value, 9, 'string value');
  });

test('Larger decreasing values', t => {
    let value = updateValue(10, 8, 5);
    t.equal(value, 8, 'integer value');
    value = updateValue(10.0, 8.0, 5);
    t.equal(value, 8.0, 'float value');
    value = updateValue("10", "8", 5);
    t.equal(value, 8, 'string value');
  });
