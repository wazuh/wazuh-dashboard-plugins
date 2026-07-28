import assert from 'node:assert/strict';
import { describeError } from './errors';

test('describeError: an Error instance returns its .message', () => {
  assert.equal(describeError(new Error('network down')), 'network down');
});

test('describeError: an Error subclass still returns its .message', () => {
  class CustomError extends Error {}
  assert.equal(
    describeError(new CustomError('custom failure')),
    'custom failure',
  );
});

test('describeError: a plain string is stringified as-is', () => {
  assert.equal(describeError('plain string error'), 'plain string error');
});

test('describeError: null/undefined are stringified via String()', () => {
  assert.equal(describeError(null), 'null');
  assert.equal(describeError(undefined), 'undefined');
});

test('describeError: a non-Error object is stringified via String(), not JSON.stringify', () => {
  assert.equal(
    describeError({ message: 'looks like an error but is not' }),
    '[object Object]',
  );
});

test('describeError: a number/boolean is stringified via String()', () => {
  assert.equal(describeError(42), '42');
  assert.equal(describeError(false), 'false');
});
