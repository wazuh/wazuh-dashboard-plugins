import assert from 'node:assert/strict';
import { ChatMessage } from '../../common/types';
import {
  FINAL_ROUND_ANSWER_INSTRUCTION,
  shouldEnterFinalRoundEarly,
  withFinalRoundAnswerInstruction,
} from './chat';

/**
 * Issue #8893: a turn that exhausted the tool-round budget ended with no model-written text at all.
 * Dropping `tools` on the final round terminates the tool loop but never ASKS for a conclusion, so
 * the model rationally produced nothing and the user got the `!sawAnyDelta` fallback copy sitting
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

test('FINAL_ROUND_ANSWER_INSTRUCTION: constrains the model to the gathered results', () => {
  // Guards the anti-fabrication property against a well-meaning future reword. Asking a model for
  // an answer it cannot support is how invented counts and agent names appear — the instruction has
  // to buy analysis WITHOUT buying invention, and has to leave the honest "I can't answer" reachable.
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /only the tool results already gathered/i,
  );
  assert.match(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /do not state anything the results do not show/i,
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
