import assert from 'node:assert/strict';
import { InlineReasoningMarkupFilter } from './inline-reasoning-markup-filter';

/** Feeds `chunks` through `filter.push` one at a time, concatenating every returned piece with
 * the final `flush()` output -- i.e. "what the client would have seen, in order, for this
 * stream". Mirrors markdown-table-filter.test.ts's `run()` helper. */
function run(filter: InlineReasoningMarkupFilter, chunks: string[]): string {
  let out = '';
  for (const chunk of chunks) {
    out += filter.push(chunk);
  }
  out += filter.flush();
  return out;
}

test('InlineReasoningMarkupFilter: no markup -> byte-identical passthrough (gpt-oss-style clean content)', () => {
  const filter = new InlineReasoningMarkupFilter();
  const input = 'The cluster is healthy. 3 agents are active and reporting.';
  assert.equal(run(filter, [input]), input);
  assert.equal(filter.didStrip, false);
});

test('InlineReasoningMarkupFilter: a closed <think> block is stripped entirely', () => {
  const filter = new InlineReasoningMarkupFilter();
  const input =
    '<think>\nThe user wants the RAM and CPU of this host.\n</think>\n\nIt has 16GB RAM and 4 vCPUs.';
  assert.equal(run(filter, [input]), '\n\nIt has 16GB RAM and 4 vCPUs.');
  assert.equal(filter.didStrip, true);
});

test('InlineReasoningMarkupFilter: a <think> tag split across two chunks is still stripped', () => {
  const filter = new InlineReasoningMarkupFilter();
  const out = run(filter, [
    'Before. <thi',
    'nk>hidden reasoning</th',
    'ink> After.',
  ]);
  assert.equal(out, 'Before.  After.');
});

test('InlineReasoningMarkupFilter: an unclosed <think> running to end of stream is stripped rather than shown', () => {
  const filter = new InlineReasoningMarkupFilter();
  const out = run(filter, [
    'Here is the answer.\n\n<think>\nThe user wants the RAM and CPU',
    ' of this host, still reasoning with no closing tag...',
  ]);
  assert.equal(out, 'Here is the answer.\n\n');
});

test('InlineReasoningMarkupFilter: <tool_call>/<function=>/<parameter=> markup is stripped, including when unclosed', () => {
  const filter = new InlineReasoningMarkupFilter();
  // Verbatim shape from the issue's captured example: the tool_call block itself is never closed.
  const out = run(filter, [
    '<tool_call>\n<function=search_wazuh_data>\n<parameter=index_pattern>\nwazuh-states-*\n',
  ]);
  assert.equal(out, '');
  assert.equal(filter.didStrip, true);
});

test('InlineReasoningMarkupFilter: a closed <tool_call> block mid-answer is stripped, prose around it kept', () => {
  const filter = new InlineReasoningMarkupFilter();
  const out = run(filter, [
    'Checking the index. ',
    '<tool_call><function=search_wazuh_data><parameter=index>wazuh-alerts-*</parameter></function></tool_call>',
    ' Done.',
  ]);
  assert.equal(out, 'Checking the index.  Done.');
});

test('InlineReasoningMarkupFilter: a legitimate <script> mention is preserved verbatim', () => {
  const filter = new InlineReasoningMarkupFilter();
  const input =
    'The rule flags any payload containing a <script> tag as a possible XSS attempt.';
  assert.equal(run(filter, [input]), input);
  assert.equal(filter.didStrip, false);
});

test('InlineReasoningMarkupFilter: a numeric comparison like "size < 500" is preserved verbatim', () => {
  const filter = new InlineReasoningMarkupFilter();
  const input = 'Only alerts where size < 500 and severity > 3 were kept.';
  assert.equal(run(filter, [input]), input);
  assert.equal(filter.didStrip, false);
});

test('InlineReasoningMarkupFilter: "size < 500" split right after the "<" is still preserved once resolved', () => {
  const filter = new InlineReasoningMarkupFilter();
  // Forces the ambiguous-tail path: the chunk boundary falls immediately after '<', with no '>'
  // yet to prove it isn't the start of a tag.
  const out = run(filter, ['Only alerts where size <', ' 500 were kept.']);
  assert.equal(out, 'Only alerts where size < 500 were kept.');
});

test('InlineReasoningMarkupFilter: a fully-stripped answer (only <think> markup) yields empty output', () => {
  const filter = new InlineReasoningMarkupFilter();
  const out = run(filter, [
    '<think>only private deliberation, no real answer</think>',
  ]);
  assert.equal(out, '');
  assert.equal(filter.didStrip, true);
});

test('InlineReasoningMarkupFilter: a <think> close tag split across three tiny chunks is still recognized', () => {
  const filter = new InlineReasoningMarkupFilter();
  const out = run(filter, ['<think>hidden', '</th', 'in', 'k>Answer.']);
  assert.equal(out, 'Answer.');
});

test('InlineReasoningMarkupFilter: a DeepSeek <｜DSML｜function_calls> marker is stripped, real answer after it is kept', () => {
  const filter = new InlineReasoningMarkupFilter();
  // Verbatim shape from a live capture (provider-matrix-bedrock-deepseek-v3-2.jsonl): no closing
  // tag ever appears, and the real answer runs on immediately, same line.
  const input =
    "I'll search for critical-severity findings from the last 24 hours across the entire fleet.\n\n<｜DSML｜function_callsThere were no critical findings in the last 24 hours.";
  const out = run(filter, [input]);
  assert.equal(
    out,
    "I'll search for critical-severity findings from the last 24 hours across the entire fleet.\n\nThere were no critical findings in the last 24 hours.",
  );
  assert.equal(filter.didStrip, true);
});

test('InlineReasoningMarkupFilter: a <｜DSML｜> marker split across chunks is still stripped', () => {
  const filter = new InlineReasoningMarkupFilter();
  const out = run(filter, [
    "I'll check the current active agent status for you.\n\n<｜DS",
    'ML｜function_calls',
    'There is 1 active agent currently enrolled.',
  ]);
  assert.equal(
    out,
    "I'll check the current active agent status for you.\n\nThere is 1 active agent currently enrolled.",
  );
  assert.equal(filter.didStrip, true);
});

test('InlineReasoningMarkupFilter: does not suppress text after an unclosed <｜DSML｜> marker (zero-width, not a container)', () => {
  const filter = new InlineReasoningMarkupFilter();
  const out = run(filter, [
    '<｜DSML｜function_calls',
    'The answer continues normally and must not be dropped.',
  ]);
  assert.equal(out, 'The answer continues normally and must not be dropped.');
});
