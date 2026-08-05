import assert from 'node:assert/strict';
import { addUsage, toStreamUsage, ZERO_USAGE_TOTALS } from './chat-usage';

/**
 * Proves the accumulator chat.ts's orchestrate loop now relies on to sum `usage` across every
 * round (plus the stage-1 routing call) of one turn, instead of only forwarding the LAST round's
 * `done.usage` to the client (issue 14-accumulate-usage-across-calls.md). Runs standalone: this
 * module has no OSD import (see chat-usage.ts's doc comment), unlike chat.ts itself
 * (chat-stream-limiter.test.ts's doc comment explains why THAT file needs the OSD tree).
 */

test('addUsage: sums a multi-round turn (stage 1 + two tool rounds + a final round)', () => {
  let totals = ZERO_USAGE_TOTALS;
  totals = addUsage(totals, { inputTokens: 300, outputTokens: 20 }); // stage 1
  totals = addUsage(totals, { inputTokens: 1200, outputTokens: 150 }); // round 0 (tool call)
  totals = addUsage(totals, { inputTokens: 1800, outputTokens: 400 }); // round 1 (tool call)
  totals = addUsage(totals, { inputTokens: 2500, outputTokens: 800 }); // round 2 (final answer)

  assert.deepEqual(toStreamUsage(totals), {
    inputTokens: 300 + 1200 + 1800 + 2500,
    outputTokens: 20 + 150 + 400 + 800,
  });
});

test('addUsage: a single-round turn is a no-op sum (unchanged behavior)', () => {
  const totals = addUsage(ZERO_USAGE_TOTALS, {
    inputTokens: 512,
    outputTokens: 64,
  });
  assert.deepEqual(toStreamUsage(totals), { inputTokens: 512, outputTokens: 64 });
});

test('addUsage: an undefined usage (adapter reported none for that call) contributes zero, does not reset', () => {
  let totals = ZERO_USAGE_TOTALS;
  totals = addUsage(totals, { inputTokens: 100, outputTokens: 10 });
  totals = addUsage(totals, undefined);
  assert.deepEqual(toStreamUsage(totals), { inputTokens: 100, outputTokens: 10 });
});

test('toStreamUsage: returns undefined (not zeros) when nothing was ever accumulated', () => {
  assert.equal(toStreamUsage(ZERO_USAGE_TOTALS), undefined);
});

test('toStreamUsage: returns undefined when every call reported undefined usage', () => {
  let totals = ZERO_USAGE_TOTALS;
  totals = addUsage(totals, undefined);
  totals = addUsage(totals, undefined);
  assert.equal(toStreamUsage(totals), undefined);
});
