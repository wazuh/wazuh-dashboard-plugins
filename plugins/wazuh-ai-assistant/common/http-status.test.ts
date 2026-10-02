import assert from 'node:assert/strict';
import { getHttpErrorBodyMessage, getHttpErrorStatus } from './http-status';

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

test('getHttpErrorBodyMessage: reads the server message off error.body.message', () => {
  const error = { body: { message: 'Missing indexer permission.' } };
  assert.equal(getHttpErrorBodyMessage(error), 'Missing indexer permission.');
});

test('getHttpErrorBodyMessage: a blank, missing or non-string message is undefined', () => {
  assert.equal(
    getHttpErrorBodyMessage({ body: { message: '   ' } }),
    undefined,
  );
  assert.equal(getHttpErrorBodyMessage({ body: {} }), undefined);
  assert.equal(getHttpErrorBodyMessage({ body: { message: 42 } }), undefined);
  assert.equal(getHttpErrorBodyMessage({ body: 'nope' }), undefined);
  assert.equal(getHttpErrorBodyMessage(new Error('Forbidden')), undefined);
});

test('getHttpErrorBodyMessage: null/undefined/primitive inputs are undefined, never throw', () => {
  assert.equal(getHttpErrorBodyMessage(null), undefined);
  assert.equal(getHttpErrorBodyMessage(undefined), undefined);
  assert.equal(getHttpErrorBodyMessage('a string'), undefined);
});
