import assert from 'node:assert/strict';
import {
  MarkdownTableSuppressor,
  TABLE_REPLACEMENT_LINE,
} from './markdown-table-filter';

/** Feeds `chunks` through `sup.push` one at a time, concatenating every returned piece with the
 * final `flush()` output — i.e. "what the client would have seen, in order, for this stream". */
function run(sup: MarkdownTableSuppressor, chunks: string[]): string {
  let out = '';
  for (const chunk of chunks) {
    out += sup.push(chunk);
  }
  out += sup.flush();
  return out;
}

test('MarkdownTableSuppressor: no table -> byte-identical passthrough', () => {
  const sup = new MarkdownTableSuppressor();
  const input =
    'Here are the top 3 agents by alert count:\n\nAgent web01 leads with 42 alerts.\n';
  assert.equal(run(sup, [input]), input);
});

test('MarkdownTableSuppressor: a table block is dropped and replaced once', () => {
  const sup = new MarkdownTableSuppressor();
  const input =
    'Summary:\n\n' +
    '| agent | alerts |\n' +
    '|---|---|\n' +
    '| web01 | 42 |\n' +
    '| web02 | 17 |\n\n' +
    'web01 has the most alerts.\n';
  const out = run(sup, [input]);

  assert.equal(
    out,
    'Summary:\n\n' +
      `${TABLE_REPLACEMENT_LINE}\n` +
      '\n' +
      'web01 has the most alerts.\n',
  );
  // Exactly one replacement line for the one block.
  assert.equal(out.split(TABLE_REPLACEMENT_LINE).length - 1, 1);
});

test('MarkdownTableSuppressor: multiple separate blocks each get their own single replacement', () => {
  const sup = new MarkdownTableSuppressor();
  const input =
    '| a | b |\n' +
    '|---|---|\n' +
    '| 1 | 2 |\n' +
    '\n' +
    'some prose in between\n' +
    '\n' +
    '| c | d |\n' +
    '|---|---|\n' +
    '| 3 | 4 |\n';
  const out = run(sup, [input]);

  assert.equal(
    out,
    `${TABLE_REPLACEMENT_LINE}\n` +
      '\n' +
      'some prose in between\n' +
      '\n' +
      `${TABLE_REPLACEMENT_LINE}\n`,
  );
  assert.equal(out.split(TABLE_REPLACEMENT_LINE).length - 1, 2);
});

test('MarkdownTableSuppressor: a pipe inside a fenced code block is preserved untouched', () => {
  const sup = new MarkdownTableSuppressor();
  const input =
    'Query used:\n' +
    '```json\n' +
    '{ "a": "b" }\n' +
    '| not | a | table | either |\n' +
    '```\n' +
    'Done.\n';
  assert.equal(run(sup, [input]), input);
});

test('MarkdownTableSuppressor: a single stray line with one pipe passes through', () => {
  const sup = new MarkdownTableSuppressor();
  const input = 'The ratio is a | b, not a table row.\n';
  assert.equal(run(sup, [input]), input);
});

test('MarkdownTableSuppressor: a single lone pipe-row line (no second consecutive row) passes through', () => {
  const sup = new MarkdownTableSuppressor();
  // Starts with '|' and has a second '|' — matches the pipe-row shape — but there is no second
  // consecutive table-row line, so it must never be collapsed, only released as-is.
  const input = '| just one row |\nMore text follows.\n';
  assert.equal(run(sup, [input]), input);
});

test('MarkdownTableSuppressor: a table block split across many small chunks is still detected', () => {
  const sup = new MarkdownTableSuppressor();
  const full =
    'Before.\n' +
    '| agent | alerts |\n' +
    '|---|---|\n' +
    '| web01 | 42 |\n' +
    'After.\n';
  // Split into 1-3 char chunks to simulate token-by-token streaming, deliberately not
  // line-aligned (chunk boundaries fall mid-line and mid-token).
  const chunks: string[] = [];
  for (let i = 0; i < full.length; i += 3) {
    chunks.push(full.slice(i, i + 3));
  }
  const out = run(sup, chunks);
  assert.equal(out, 'Before.\n' + `${TABLE_REPLACEMENT_LINE}\n` + 'After.\n');
});

test('MarkdownTableSuppressor: flush() releases a pending block and a non-newline-terminated remainder', () => {
  const sup = new MarkdownTableSuppressor();
  let out = sup.push('| a | b |\n|---|---|\n| 1 | 2 |\n');
  assert.equal(out, ''); // Still buffered — the block hasn't been resolved by a following line yet.
  out += sup.push('trailing text with no newline yet');
  const flushed = sup.flush();
  out += flushed;

  assert.equal(
    out,
    `${TABLE_REPLACEMENT_LINE}\n` + 'trailing text with no newline yet',
  );
  // A second flush is a harmless no-op.
  assert.equal(sup.flush(), '');
});

test('MarkdownTableSuppressor: text before and after a dropped block is preserved byte-identically', () => {
  const sup = new MarkdownTableSuppressor();
  const before = 'Line one.\nLine two with unicode: café, 日本語.\n';
  const table = '| x | y |\n|---|---|\n| 1 | 2 |\n';
  const after = 'Final line.\n';
  const out = run(sup, [before, table, after]);

  assert.ok(out.startsWith(before), 'prefix must be untouched');
  assert.ok(out.endsWith(after), 'suffix must be untouched');
  assert.equal(out, before + `${TABLE_REPLACEMENT_LINE}\n` + after);
});
