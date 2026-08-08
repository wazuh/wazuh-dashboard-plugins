import assert from 'node:assert/strict';
import { addUsage, toStreamUsage, ZERO_USAGE_TOTALS } from './chat-usage';

/**
 * Proves the accumulator chat.ts's orchestrate loop now relies on to sum `usage` across every
 * round (plus the stage-1 routing call) of one turn, instead of only forwarding the LAST round's
 * `done.usage` to the client (issue 8875). Runs standalone: this
 * module has no OSD import (see chat-usage.ts's doc comment), unlike chat.ts itself
 * (chat-stream-limiter.test.ts's doc comment explains why THAT file needs the OSD tree).
 *
 * This accumulator was never actually the bug: the sum it computes here has always been correct.
 * What was broken sat one level down, in server/providers/openai-compatible.ts -- every provider
 * call that ended via `finish_reason: 'tool_calls'` (every non-final round, AND the stage-1 router
 * call, which always ends that way by construction) returned before ever reading the terminal
 * `usage` frame `stream_options.include_usage` unlocks, so `addUsage` above was only ever handed
 * one real number per turn (the last, tool-free round's) and zero/`undefined` for every other call
 * -- see chat-stage1-usage.test.ts and openai-compatible.test.ts's "terminal usage frame after a
 * tool-call finish" tests for coverage of that actual defect. The two tests below encode the
 * specific live symptom that exposed it: a real cross-round sum must look like N times one round,
 * not one round plus a small constant.
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
  assert.deepEqual(toStreamUsage(totals), {
    inputTokens: 512,
    outputTokens: 64,
  });
});

test('addUsage: an undefined usage (adapter reported none for that call) contributes zero, does not reset', () => {
  let totals = ZERO_USAGE_TOTALS;
  totals = addUsage(totals, { inputTokens: 100, outputTokens: 10 });
  totals = addUsage(totals, undefined);
  assert.deepEqual(toStreamUsage(totals), {
    inputTokens: 100,
    outputTokens: 10,
  });
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

test('addUsage: two rounds of roughly-equal size sum to ~2x a single round, not one round plus a small constant', () => {
  // Reproduces the live-measured shape of the still-broken bug (issue 8875's update): a
  // 1-tool-call turn reported 7,105 vs. a 6,814 zero-tool baseline -- +291, not +~6,814. A correct
  // accumulator fed the SAME per-round number twice must land near double, and specifically far
  // outside the "+291-shaped" neighborhood a last-round-only readout would produce.
  const singleRound = { inputTokens: 6814, outputTokens: 140 };
  let totals = ZERO_USAGE_TOTALS;
  totals = addUsage(totals, singleRound);
  totals = addUsage(totals, singleRound);
  const summed = toStreamUsage(totals);
  assert.deepEqual(summed, { inputTokens: 6814 * 2, outputTokens: 140 * 2 });
  assert.ok(
    (summed as { inputTokens: number }).inputTokens >
      singleRound.inputTokens + 1000,
    'a genuine sum of two rounds must clear the single round by more than a few hundred tokens ' +
      '-- the broken accumulation this issue describes only ever added ~291',
  );
});

test('addUsage: a turn whose final round reports no usage at all still sums to its earlier rounds (fallback-path shape)', () => {
  // Models the "final round streams no deltas" defect (issue 8875's update, part (b)): the last
  // round's own `done` carries no usage (provider sent none for an empty response), but stage 1
  // and the tool rounds before it did -- the turn-level total must still be their sum, not
  // null/zero, and chat.ts's `!sawAnyDelta` fallback-text branch calls this same `toStreamUsage`
  // on this same running total, so proving the total here proves that branch's number too.
  let totals = ZERO_USAGE_TOTALS;
  totals = addUsage(totals, { inputTokens: 760, outputTokens: 8 }); // stage 1
  totals = addUsage(totals, { inputTokens: 1400, outputTokens: 55 }); // round 0 (tool call)
  totals = addUsage(totals, { inputTokens: 2100, outputTokens: 90 }); // round 1 (tool call)
  totals = addUsage(totals, undefined); // final round: no deltas, no usage reported
  assert.deepEqual(toStreamUsage(totals), {
    inputTokens: 760 + 1400 + 2100,
    outputTokens: 8 + 55 + 90,
  });
});
