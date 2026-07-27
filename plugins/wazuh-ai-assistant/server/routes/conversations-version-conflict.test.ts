import assert from 'node:assert/strict';
import { isVersionConflictError } from './conversations';

// Optimistic concurrency on PUT /conversations/{id}: `isVersionConflictError` is what
// translates a rejected `client.update({version: expectedVersion})` call into the route's 409
// response. Mirrors settings-access-mapping.test.ts's convention of unit-testing a
// pure, EXPORTED helper directly rather than the route handler itself (this file has no
// request/response-mocking harness for OpenSearch Dashboards routes to hook into).

test('isVersionConflictError: a Boom-shaped 409 (error.output.statusCode) is a conflict', () => {
  const error = { output: { statusCode: 409 } };
  assert.equal(isVersionConflictError(error), true);
});

test('isVersionConflictError: a bare error.statusCode === 409 is a conflict', () => {
  const error = { statusCode: 409 };
  assert.equal(isVersionConflictError(error), true);
});

test('isVersionConflictError: an unrelated error shape (e.g. a 404) is NOT a conflict', () => {
  const error = { output: { statusCode: 404 } };
  assert.equal(isVersionConflictError(error), false);
});

test('isVersionConflictError: a plain Error with no statusCode anywhere is NOT a conflict', () => {
  assert.equal(isVersionConflictError(new Error('boom')), false);
});

test('isVersionConflictError: null/undefined never throw and are NOT a conflict', () => {
  assert.equal(isVersionConflictError(null), false);
  assert.equal(isVersionConflictError(undefined), false);
});

test('isVersionConflictError: a 500-shaped error is NOT a conflict', () => {
  assert.equal(isVersionConflictError({ output: { statusCode: 500 } }), false);
});
