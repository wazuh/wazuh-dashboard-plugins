import assert from 'node:assert/strict';
import { ChatMessage } from '../../common/types';
import {
  FINAL_ROUND_ANSWER_INSTRUCTION,
  ROUND_TEXT_SEPARATOR,
  MAX_TOOL_ROUNDS,
  shouldEnterFinalRoundEarly,
  willBeFinalRound,
  withFinalRoundAnswerInstruction,
} from './chat';

/**
 * Issue #8893: a turn that exhausted the tool-round budget ended with no model-written text at all.
 * Dropping `tools` on the final round terminates the tool loop but never ASKS for a conclusion, so
 * the model rationally produced nothing and the user got the `!roundSawAnyDelta` fallback copy sitting
 * above a populated results table (4 of 6 such turns in a 40-question persona bank).
 * `withFinalRoundAnswerInstruction` is chat.ts's fix, kept pure so the decision is testable without
 * standing up a fake `orchestrate` run.
 *
 * NOTE (needs the OSD tree to actually run): server/routes/chat.ts imports
 * `../../../../src/core/server` and `@osd/config-schema`, which only resolve inside the full
 * wazuh-dashboard checkout this repo is built against — same constraint as
 * chat-stream-limiter.test.ts, and this file follows the same colocated-unit-test convention.
 */

function conversation(): ChatMessage[] {
  return [
    { role: 'system', content: 'system prompt' },
    { role: 'user', content: 'which agents have critical findings?' },
    {
      role: 'assistant',
      content: '',
      toolCalls: [
        { id: 'call_1', name: 'get_critical_findings', arguments: {} },
      ],
    },
    { role: 'tool', content: '{"counts":{"total":26}}', toolCallId: 'call_1' },
  ];
}

test('withFinalRoundAnswerInstruction: appends the instruction on the final round of a tool-using turn', () => {
  const messages = conversation();
  const out = withFinalRoundAnswerInstruction(messages, true, true);

  assert.equal(
    out.length,
    messages.length + 1,
    'exactly one message is added, never more',
  );
  assert.deepEqual(out[out.length - 1], {
    role: 'system',
    content: FINAL_ROUND_ANSWER_INSTRUCTION,
  });
});

test('withFinalRoundAnswerInstruction: the instruction goes LAST, after the tool results', () => {
  const out = withFinalRoundAnswerInstruction(conversation(), true, true);
  // The whole point is that it is the most recent thing the model reads — placed before the tool
  // results it would be answering a question about data it had not seen yet.
  assert.equal(out[out.length - 1].content, FINAL_ROUND_ANSWER_INSTRUCTION);
  assert.equal(out[out.length - 2].role, 'tool');
});

test('withFinalRoundAnswerInstruction: no-tool turn is left alone, even on the final round', () => {
  // A `general`-routed turn has no gathered results, so "use only the tool results already
  // gathered" would be a lie; that path's silence has its own fix and its own fallback copy.
  const messages = conversation();
  const out = withFinalRoundAnswerInstruction(messages, true, false);
  assert.equal(out, messages, 'returns the SAME reference, not a copy');
});

test('withFinalRoundAnswerInstruction: non-final rounds are left alone', () => {
  const messages = conversation();
  assert.equal(
    withFinalRoundAnswerInstruction(messages, false, true),
    messages,
  );
  assert.equal(
    withFinalRoundAnswerInstruction(messages, false, false),
    messages,
  );
});

test('withFinalRoundAnswerInstruction: never mutates the caller array', () => {
  // chat.ts passes `messages` ITSELF (the turn's accumulating source of truth) whenever privacy
  // mode is off, so a mutating implementation would leak this per-request nudge into conversation
  // history and re-send it on every later turn.
  const messages = conversation();
  const before = messages.length;
  withFinalRoundAnswerInstruction(messages, true, true);
  assert.equal(messages.length, before);
  assert.ok(
    !messages.some(m => m.content === FINAL_ROUND_ANSWER_INSTRUCTION),
    'the instruction must not end up in the source-of-truth array',
  );
});

// --- shouldEnterFinalRoundEarly (issue #8911) --------------------------------------------------
//
// A tool round with only rejected/errored calls burns the same round budget as a productive one.
// `shouldEnterFinalRoundEarly` decides whether the round that just finished should make the NEXT
// round the final one early, instead of letting the model keep re-guessing a query shape that can
// never succeed. Kept pure, same reasoning as `withFinalRoundAnswerInstruction` above, so these
// three scenarios are testable without a fake `orchestrate` run.

test('shouldEnterFinalRoundEarly: an all-rejected round that follows an earlier successful round enters the final round early', () => {
  assert.equal(
    shouldEnterFinalRoundEarly(
      /* roundHadToolCalls */ true,
      /* roundHadSuccess */ false,
      /* hadSuccessfulRoundEarlier */ true,
    ),
    true,
  );
});

test('shouldEnterFinalRoundEarly: an all-rejected FIRST round keeps its retry budget (no earlier success yet)', () => {
  // The model may legitimately be fixing its own call on the very next round — only a fully-rejected
  // round AFTER an earlier success is treated as "stuck", not a turn's opening attempt.
  assert.equal(
    shouldEnterFinalRoundEarly(
      /* roundHadToolCalls */ true,
      /* roundHadSuccess */ false,
      /* hadSuccessfulRoundEarlier */ false,
    ),
    false,
  );
});

test('shouldEnterFinalRoundEarly: a mixed round (at least one success) never forces the final round early', () => {
  assert.equal(
    shouldEnterFinalRoundEarly(
      /* roundHadToolCalls */ true,
      /* roundHadSuccess */ true,
      /* hadSuccessfulRoundEarlier */ true,
    ),
    false,
  );
});

test('shouldEnterFinalRoundEarly: a round with no tool calls at all never forces the final round early', () => {
  assert.equal(
    shouldEnterFinalRoundEarly(
      /* roundHadToolCalls */ false,
      /* roundHadSuccess */ false,
      /* hadSuccessfulRoundEarlier */ true,
    ),
    false,
  );
});

// --- willBeFinalRound (review fix F2, AI/plan/c-review.md): the single predicate shared by
// `isFinalRound` and the `suggest_discover_query` round-aware retry gate ------------------------

test('willBeFinalRound: true once round reaches the structural MAX_TOOL_ROUNDS cap', () => {
  assert.equal(willBeFinalRound(MAX_TOOL_ROUNDS, false, false), true);
  assert.equal(willBeFinalRound(MAX_TOOL_ROUNDS - 1, false, false), false);
});

test('willBeFinalRound: true whenever #8911/F3 already latched forceFinalRoundEarly, regardless of round index', () => {
  assert.equal(willBeFinalRound(0, true, false), true);
});

test('willBeFinalRound: true whenever the cost/context/futility budget already latched budgetForcesFinalRoundEarly, regardless of round index', () => {
  assert.equal(willBeFinalRound(0, false, true), true);
});

test('willBeFinalRound: false when neither latch is set and the structural cap has not been reached', () => {
  assert.equal(willBeFinalRound(1, false, false), false);
});

test('FINAL_ROUND_ANSWER_INSTRUCTION: constrains every FACT to the gathered results', () => {
  // Guards the anti-fabrication property against a well-meaning future reword. Asking a model for
  // an answer it cannot support is how invented counts and agent names appear — the instruction has
  // to buy analysis WITHOUT buying invention, and has to leave the honest "I can't answer" reachable.
  // Explain-wave phase 1 narrowed the clause from "only the tool results" (which also banned
  // interpretation) to "every FACT about this environment", so the grounding assertion now pins the
  // DATA scope explicitly — see the advisory test below for the other half.
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /Every FACT about this environment/,
  );
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /must come from the tool results already gathered/i,
  );
  // The enumeration must stay OPEN. A closed list ("counts, names, ids, entities, timestamps,
  // statuses") is narrower than the blanket ban it replaced: CVSS scores, package versions, IPs,
  // ports, file paths and SCA control numbers all fall outside it, and a model reads a closed list
  // as the boundary of the rule. Pin the non-exhaustiveness and the catch-all, not the examples.
  assert.match(FINAL_ROUND_ANSWER_INSTRUCTION, /including but not limited to/i);
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /any other data point describing what is in this deployment/i,
  );
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /never state a data point the results do not show/i,
  );
  assert.match(FINAL_ROUND_ANSWER_INSTRUCTION, /say so plainly/i);
  // UI run 2026-08-14 (B3): on the forced final round the model answered AND announced "Let me
  // pull the same window broken down over time" -- then the turn ended, because no round was
  // left to keep that promise. Nothing in the instruction forbade announcing further work. B4
  // was the natural control: identical phrasing, budget remaining, the follow-up actually ran.
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /do\s+not announce further data pulls/i,
  );
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /no\s+more tool calls will run/i,
  );
});

// Explain-wave phase 1 (AI/plan/eval-v2 gap 1): this instruction lands on the round where an
// "explain this event / how do we protect against it" answer has to be written, and its old
// blanket wording forbade exactly the knowledge such an answer needs (what a technique is, what
// mitigates it) — knowledge no tool in this product returns. The two properties below must hold
// TOGETHER: advisory content is unlocked, and it is fenced so it can never be read as observed
// data. A reword that drops either one re-breaks a whole question class or opens a fabrication
// path, so both are pinned here.
test('FINAL_ROUND_ANSWER_INSTRUCTION: permits general security knowledge for the explanatory half', () => {
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /MAY use your general security knowledge/,
  );
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /why it matters, how that class of activity is typically detected, or how to protect against it/i,
  );
  // Detection provenance is NOT on the advisory side. "How it is detected" as a licensed knowledge
  // topic invites an invented rule id or detector name when only get_mitre_findings ran, so the
  // generic case is knowledge and the deployment-specific one stays a grounded fact.
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /What detected something HERE \(rule ids, rule titles, detectors\) is one of those facts, not general knowledge/,
  );
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /if the results do not name it, say so instead of guessing/i,
  );
});

test('FINAL_ROUND_ANSWER_INSTRUCTION: fences that knowledge off from observed data', () => {
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /clearly separate part of the answer/i,
  );
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /framed as guidance rather than as something observed in the data/i,
  );
  // Mirrors the shipped Group E how-to policy in prompts.ts (answer from general knowledge, but
  // say it needs verifying) rather than inventing a second, divergent disclaimer rule.
  assert.match(FINAL_ROUND_ANSWER_INSTRUCTION, /verified before acting on it/i);
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /Never present general knowledge as an environment fact/i,
  );
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /never invent data to support it/i,
  );
});

// UI run 2026-08-14 (finding 6): every round's text lands in ONE client bubble, so a round that
// narrates before calling a tool ran straight into the next round's answer -- measured live as
// "...for it.The most frequent finding...", fused mid-word, and one bubble restating itself with
// two different counts. A markdown paragraph break is the minimum separation; a single newline
// would not render as one.
test('ROUND_TEXT_SEPARATOR: a markdown paragraph break, not a bare newline', () => {
  assert.equal(ROUND_TEXT_SEPARATOR, '\n\n');
});
