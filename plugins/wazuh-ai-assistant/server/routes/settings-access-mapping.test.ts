import assert from 'node:assert/strict';
import { describeAdministratorRequirement } from './settings';

// The reference plugin's live `isAdministratorUser` Manager
// probe can 401 when opening this app directly never established a `wz-token` cookie, surfacing a
// free-form string that is NOT one of the three original exact-literal "token missing" reasons —
// this must still map to the actionable "session is missing or expired" copy, not the generic
// fallback.

test('describeAdministratorRequirement: exact-literal "No token provider" still maps to the actionable copy', () => {
  const message = describeAdministratorRequirement('No token provider');
  assert.match(message, /session is missing or expired/);
  assert.match(message, /\(No token provider\)/);
});

test('describeAdministratorRequirement: live-probe "...status code 401" maps to the SAME actionable copy', () => {
  const raw =
    'It could not check if the current user is administrator due to: Request failed with status code 401';
  const message = describeAdministratorRequirement(raw);
  assert.match(message, /session is missing or expired/);
  // The raw reason must still be appended verbatim in parentheses.
  assert.ok(message.includes(`(${raw})`));
});

test('describeAdministratorRequirement: "could not check" + "401" (no exact "status code 401" substring) also maps to the actionable copy', () => {
  const raw = 'could not check administrator status: manager responded 401';
  const message = describeAdministratorRequirement(raw);
  assert.match(message, /session is missing or expired/);
});

test('describeAdministratorRequirement: an unrelated failure reason still falls back to the generic message', () => {
  const raw = 'Some unrelated internal error';
  const message = describeAdministratorRequirement(raw);
  assert.doesNotMatch(message, /session is missing or expired/);
  assert.match(message, /Administrator privileges are required/);
  assert.ok(message.includes(`(${raw})`));
});

test('describeAdministratorRequirement: null reason falls back to the generic message with no trailing parens', () => {
  const message = describeAdministratorRequirement(null);
  assert.match(message, /Administrator privileges are required/);
  assert.ok(!message.includes('('));
});
