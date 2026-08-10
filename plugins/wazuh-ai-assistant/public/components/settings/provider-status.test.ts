import assert from 'node:assert/strict';
import {
  describeHttpError,
  outcomeFromTestError,
  outcomeFromTestResult,
} from './provider-status';

/**
 * Issue #8854, point 3: "One Failed badge covers four different situations, including one that
 * is not the provider's fault." These tests pin the split this fix introduces: a completed test
 * (`outcomeFromTestResult`) is `ok`/`failed`, while a test that never ran at all
 * (`outcomeFromTestError`, e.g. the admin-gate check itself failing) is the distinct
 * `could-not-verify` status — never rendered as the same red "Failed" badge.
 */

test('outcomeFromTestResult: a successful test maps to ok with the measured latency', () => {
  const outcome = outcomeFromTestResult({ success: true, latencyMs: 237 });
  assert.deepEqual(outcome, { status: 'ok', latencyMs: 237 });
});

test('outcomeFromTestResult: a completed-but-unsuccessful test maps to failed with the server message', () => {
  const outcome = outcomeFromTestResult({
    success: false,
    latencyMs: 15002,
    message: 'The model gpt-5 does not exist or you do not have access to it.',
  });
  assert.deepEqual(outcome, {
    status: 'failed',
    message: 'The model gpt-5 does not exist or you do not have access to it.',
  });
});

test('outcomeFromTestResult: a failed test with no message falls back to a generic one', () => {
  const outcome = outcomeFromTestResult({ success: false, latencyMs: 0 });
  assert.equal(outcome.status, 'failed');
  assert.equal((outcome as { message: string }).message, 'Connection failed.');
});

test('outcomeFromTestError: an admin-gate rejection (thrown, never reached the provider) maps to could-not-verify', () => {
  const adminGateError = {
    body: {
      message:
        'Your Wazuh Manager API session is missing or expired. Open any page of the main ' +
        'Wazuh app to establish it, then retry saving.',
    },
  };
  const outcome = outcomeFromTestError(adminGateError);
  assert.equal(outcome.status, 'could-not-verify');
  assert.equal(
    (outcome as { message: string }).message,
    adminGateError.body.message,
  );
});

test('outcomeFromTestError: a thrown error is NEVER classified as failed — only ok/failed come from a completed result', () => {
  const outcome = outcomeFromTestError(new Error('network error'));
  assert.notEqual(outcome.status, 'failed');
  assert.equal(outcome.status, 'could-not-verify');
});

test('outcomeFromTestError: an error with no extractable message falls back to a generic could-not-verify copy', () => {
  const outcome = outcomeFromTestError('a plain string, not an Error');
  assert.deepEqual(outcome, {
    status: 'could-not-verify',
    message: 'Could not verify the provider status.',
  });
});

test('describeHttpError: prefers body.message over error.message', () => {
  const error = new Error('generic Forbidden');
  (error as { body?: unknown }).body = { message: 'the real server reason' };
  assert.equal(describeHttpError(error, 'fallback'), 'the real server reason');
});

test('describeHttpError: falls back to error.message when body.message is absent', () => {
  assert.equal(
    describeHttpError(new Error('plain error message'), 'fallback'),
    'plain error message',
  );
});

test('describeHttpError: falls back to the caller-supplied fallback for a non-Error, non-body value', () => {
  assert.equal(describeHttpError(null, 'fallback'), 'fallback');
  assert.equal(describeHttpError(42, 'fallback'), 'fallback');
});
