import assert from 'node:assert/strict';
import { ChatMessage } from '../../common/types';
import {
  FINAL_ROUND_ANSWER_INSTRUCTION,
  FINAL_ROUND_CONTINUATION_INSTRUCTION,
  withFinalRoundAnswerInstruction,
} from './chat';

/**
 * DUPLICATE ANSWER (wazuh-dashboard#1527): one turn shipped TWO complete answers, the second one
 * opening "As noted above…". Root cause is the combination of two mechanisms, both of which are
 * needed to reproduce it:
 *
 *  1. the deferred-offer interception (#8935 item I3) keeps the turn alive after a round that
 *     streamed a COMPLETE answer and made no tool call, and appends that already-on-screen text to
 *     the outbound history as an `assistant` message so the forced round is not authored blind;
 *  2. the final round of every tool-using turn then appended FINAL_ROUND_ANSWER_INSTRUCTION —
 *     "Now answer the user's question directly" — i.e. it ORDERED a re-synthesis of a question the
 *     model can see, in its own history, that it already answered.
 *
 * The fix is code-side and in mechanism 2: on a turn where an answer already reached the screen,
 * the final round is handed FINAL_ROUND_CONTINUATION_INSTRUCTION instead, which forbids a second
 * version and asks only for what the new results add. This file pins WHICH string is sent for each
 * shape of turn — the deterministic half. What the model then writes is model-side, as it is for
 * every instruction in this file's sibling tests.
 *
 * NOTE (needs the OSD tree to actually run): server/routes/chat.ts imports
 * `../../../../src/core/server` and `@osd/config-schema`, which only resolve inside the full
 * wazuh-dashboard checkout this repo is built against — same constraint as
 * chat-final-round-instruction.test.ts, and this file follows the same colocated convention.
 */

function conversation(): ChatMessage[] {
  return [
    { role: 'system', content: 'system prompt' },
    { role: 'user', content: 'which agents have failing SCA checks?' },
    {
      role: 'assistant',
      content: '',
      toolCalls: [{ id: 'call_1', name: 'get_sca_results', arguments: {} }],
    },
    { role: 'tool', content: '{"counts":{"failed":12}}', toolCallId: 'call_1' },
    // The answer the user has ALREADY READ, appended to history by the deferred-offer
    // interception before it forced the follow-up call.
    {
      role: 'assistant',
      content:
        'Agent 001 has 12 failing SCA checks. I can run get_sca_checks to list them — want me to?',
    },
    {
      role: 'assistant',
      content: '',
      toolCalls: [{ id: 'call_2', name: 'get_sca_checks', arguments: {} }],
    },
    { role: 'tool', content: '{"checks":[]}', toolCallId: 'call_2' },
  ];
}

test('a turn that already streamed an answer gets the CONTINUATION instruction, not a second "answer the question" order', () => {
  const messages = conversation();
  const out = withFinalRoundAnswerInstruction(messages, true, true, true);

  assert.equal(
    out.length,
    messages.length + 1,
    'exactly one message is added, never more',
  );
  assert.deepEqual(out[out.length - 1], {
    role: 'user',
    content: FINAL_ROUND_CONTINUATION_INSTRUCTION,
  });
  // The regression itself: the re-synthesis order must be absent from the whole outbound array,
  // not merely replaced at the tail.
  assert.ok(
    !out.some(message => message.content === FINAL_ROUND_ANSWER_INSTRUCTION),
    'the "Now answer the user\'s question directly" order is not sent on this turn',
  );
});

test('the continuation instruction forbids a second answer and keeps the grounding clauses verbatim', () => {
  assert.match(
    FINAL_ROUND_CONTINUATION_INSTRUCTION,
    /already written the answer the user is reading/i,
  );
  assert.match(FINAL_ROUND_CONTINUATION_INSTRUCTION, /Do NOT write it again/);
  assert.ok(
    !/Now answer the user's question directly/.test(
      FINAL_ROUND_CONTINUATION_INSTRUCTION,
    ),
    'the continuation variant must not contain the re-synthesis order it replaces',
  );
  // Anti-hallucination wording is shared verbatim between the two variants — a future edit to one
  // must not silently drop the fabrication guardrails from the other.
  for (const clause of [
    'must come from the tool results already gathered in this conversation',
    'never state a data point the results do not show',
    'Never present general knowledge as an environment fact',
    'no more tool calls will run',
    'describe only the coverage',
  ]) {
    assert.ok(
      FINAL_ROUND_ANSWER_INSTRUCTION.includes(clause),
      `answer instruction keeps: ${clause}`,
    );
    assert.ok(
      FINAL_ROUND_CONTINUATION_INSTRUCTION.includes(clause),
      `continuation instruction keeps: ${clause}`,
    );
  }
});

// NEGATIVE 1 — the ordinary case is untouched: a final round of a tool-using turn whose earlier
// text was PARTIAL ("let me check X" before a tool call) has not answered the user yet, so it must
// still be ordered to write the answer. This is also the default when the flag is not passed at
// all, which is what keeps every other call shape in the codebase on base behaviour.
test('a turn that has not answered yet still gets the full answer instruction', () => {
  const messages = conversation();

  for (const out of [
    withFinalRoundAnswerInstruction(messages, true, true, false),
    withFinalRoundAnswerInstruction(messages, true, true),
  ]) {
    assert.deepEqual(out[out.length - 1], {
      role: 'user',
      content: FINAL_ROUND_ANSWER_INSTRUCTION,
    });
    assert.ok(
      !out.some(
        message => message.content === FINAL_ROUND_CONTINUATION_INSTRUCTION,
      ),
      'the continuation variant is not sent on a turn that never answered',
    );
  }
});

// NEGATIVE 2 — the latch changes only WHICH instruction a final round gets; it must never make a
// non-final round (the zero-row widening retry's round, for one: it is granted a tool-bearing
// round, not a final one) receive an instruction, and never touch a no-tool turn.
test('the latch never adds an instruction to a non-final round or a no-tool turn', () => {
  const messages = conversation();

  assert.equal(
    withFinalRoundAnswerInstruction(messages, false, true, true),
    messages,
    'a non-final round is returned unchanged (same reference), latched or not',
  );
  assert.equal(
    withFinalRoundAnswerInstruction(messages, true, false, true),
    messages,
    'a turn that ran no tool is returned unchanged (same reference)',
  );
});
