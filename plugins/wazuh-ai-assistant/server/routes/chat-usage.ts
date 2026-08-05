import { StreamUsage } from '../../common/types';

/**
 * Accumulator for `StreamUsage` across every provider call one turn makes — the stage-1 routing
 * call (`runStage1Routing`) plus every round of the main orchestration loop
 * (`orchestrate`, both in chat.ts). Before this existed, `orchestrate` forwarded each round's
 * `done` event as-is, and a bare `break` on every NON-final round's `done` (see chat.ts's round
 * loop) meant only the LAST round's `usage` ever reached the client — measured 6,409 tokens
 * reported vs. ~12,740 actually spent on a multi-round turn. A single-round turn makes exactly one
 * call, so accumulation is a no-op there: the sum of one term is that term.
 *
 * Deliberately has NO import from `chat.ts` and no OSD (`../../../../src/core/server`) import, so
 * — unlike chat.ts itself — this module and its colocated test can run standalone without the full
 * wazuh-dashboard/OSD checkout (see chat-usage.test.ts and chat-stream-limiter.test.ts's doc
 * comment for why chat.ts cannot).
 */
export interface UsageTotals {
  inputTokens: number;
  outputTokens: number;
}

/** The identity element for `addUsage` below — a turn that never sees any `usage` at all (e.g. an
 * adapter that never reports it) still ends with this, and `toStreamUsage` turns it into
 * `undefined` rather than a misleading `{inputTokens: 0, outputTokens: 0}`. */
export const ZERO_USAGE_TOTALS: UsageTotals = { inputTokens: 0, outputTokens: 0 };

/**
 * Folds one more call's `usage` (a round's `done`, or stage 1's `done`) into the running totals.
 * `usage` is `undefined` whenever the adapter that produced this call's `done` didn't report
 * usage at all (or the call never happened) — treated as contributing zero, not as resetting the
 * total, so a provider that occasionally omits `usage` never loses the tokens accounted for by
 * calls that did report it.
 */
export function addUsage(
  totals: UsageTotals,
  usage: StreamUsage | undefined,
): UsageTotals {
  return {
    inputTokens: totals.inputTokens + (usage?.inputTokens ?? 0),
    outputTokens: totals.outputTokens + (usage?.outputTokens ?? 0),
  };
}

/**
 * Converts accumulated totals into the `StreamEvent['done']['usage']` shape the client expects.
 * Returns `undefined` (rather than `{inputTokens: 0, outputTokens: 0}`) when nothing was ever
 * accumulated, so a turn where no call reported usage looks the same on the wire as it did before
 * this accumulator existed — an adapter/provider that never reports usage must not start claiming
 * "0 tokens" where it previously claimed nothing.
 */
export function toStreamUsage(totals: UsageTotals): StreamUsage | undefined {
  if (totals.inputTokens === 0 && totals.outputTokens === 0) {
    return undefined;
  }
  return { inputTokens: totals.inputTokens, outputTokens: totals.outputTokens };
}
