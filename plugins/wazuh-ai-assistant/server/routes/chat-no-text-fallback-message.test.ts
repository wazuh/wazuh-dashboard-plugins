import assert from 'node:assert/strict';
import { noTextFallbackMessage } from './chat';

test('noTextFallbackMessage: no tool used this turn falls back to the general no-answer copy', () => {
  const message = noTextFallbackMessage(false, false, false);
  assert.match(message, /not able to come up with an answer/i);
});

test('noTextFallbackMessage: a tool ran but returned nothing falls back to no-matching-results', () => {
  const message = noTextFallbackMessage(true, false, false);
  assert.match(message, /no matching results/i);
});

test('noTextFallbackMessage: a tool ran, results rendered, rounds NOT exhausted uses the generic no-analysis copy', () => {
  const message = noTextFallbackMessage(true, true, false);
  assert.match(message, /no additional analysis/i);
});

test('noTextFallbackMessage: a tool ran, results rendered, rounds exhausted discloses the unreached step', () => {
  const message = noTextFallbackMessage(true, true, true);
  assert.match(message, /tool-round budget/i);
  assert.doesNotMatch(message, /no additional analysis/i);
});

test('noTextFallbackMessage: roundsExhausted is ignored when there is no table to reference', () => {
  const message = noTextFallbackMessage(true, false, true);
  assert.match(message, /no matching results/i);
});
