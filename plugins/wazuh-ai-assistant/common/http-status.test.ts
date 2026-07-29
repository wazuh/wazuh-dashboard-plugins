import assert from 'node:assert/strict';
import { getHttpErrorStatus } from './http-status';

test('getHttpErrorStatus: reads a numeric status off error.response.status', () => {
  const error = { response: { status: 409 } };
  assert.equal(getHttpErrorStatus(error), 409);
});

test('getHttpErrorStatus: a plain Error with no response property is undefined', () => {
  assert.equal(getHttpErrorStatus(new Error('network down')), undefined);
});

test('getHttpErrorStatus: null/undefined/primitive inputs are undefined, never throw', () => {
  assert.equal(getHttpErrorStatus(null), undefined);
  assert.equal(getHttpErrorStatus(undefined), undefined);
  assert.equal(getHttpErrorStatus('a string'), undefined);
  assert.equal(getHttpErrorStatus(42), undefined);
});

test('getHttpErrorStatus: a non-numeric status is ignored', () => {
  assert.equal(getHttpErrorStatus({ response: { status: '409' } }), undefined);
});

test('getHttpErrorStatus: a response property that is not an object is ignored', () => {
  assert.equal(getHttpErrorStatus({ response: 'nope' }), undefined);
});
