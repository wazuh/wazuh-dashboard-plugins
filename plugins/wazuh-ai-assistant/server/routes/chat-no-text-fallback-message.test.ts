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

// N1 fix (AI/plan/qa-battery-v31.md): the canned empty-copy above said nothing about WHAT was
// searched — a scoped SCA/vulnerability/agent query and a wide-open one produced the identical
// sentence. These cover the enriched form, which names the data domain (from the tool name) and
// any caller-supplied filters/time-window (from its resolved arguments), in user vocabulary,
// with no orchestration-mechanism wording.

test('noTextFallbackMessage: zero-row result names the data domain it searched', () => {
  const message = noTextFallbackMessage(true, false, false, {
    name: 'get_sca_checks',
    args: { agent_id: '003', policy_id: 'cis_ubuntu22-04' },
  });
  assert.match(message, /no matching results/i);
  assert.match(message, /SCA checks/);
});

test('noTextFallbackMessage: zero-row result names the filters that narrowed it to zero', () => {
  const message = noTextFallbackMessage(true, false, false, {
    name: 'get_sca_checks',
    args: { agent_id: '003', policy_id: 'cis_ubuntu22-04', result: 'failed' },
  });
  assert.match(message, /agent 003/);
  assert.match(message, /policy cis_ubuntu22-04/);
  // `limit` is a page-size mechanism, not something the user asked to narrow by — must never
  // appear in the user-facing filter clause.
  assert.doesNotMatch(message, /limit/i);
});

test('noTextFallbackMessage: zero-row result folds a supplied time range into one time-window clause', () => {
  const message = noTextFallbackMessage(true, false, false, {
    name: 'get_agents',
    args: { time_range_gte: 'now-7d', time_range_lte: 'now', limit: 50 },
  });
  assert.match(message, /time window now-7d to now/);
  // The gte/lte parameter names themselves are mechanism/param vocabulary, not what the user
  // should read — only the folded "time window ... to ..." phrasing should appear.
  assert.doesNotMatch(message, /time_range/);
});

test('noTextFallbackMessage: zero-row result with no filters names only the domain, with no dangling punctuation', () => {
  const message = noTextFallbackMessage(true, false, false, {
    name: 'get_top_agents',
    args: {},
  });
  assert.match(message, /\(Searched: top agents\.\)/);
});

test('noTextFallbackMessage: zero-row result strips the get_/search_/lookup_ verb prefix from the domain phrase', () => {
  const lookup = noTextFallbackMessage(true, false, false, {
    name: 'lookup_indicator',
    args: { indicator: '124.70.213.43' },
  });
  assert.match(lookup, /Searched: indicator/);
  const search = noTextFallbackMessage(true, false, false, {
    name: 'search_wazuh_data',
    args: {},
  });
  assert.match(search, /Searched: wazuh data/);
});

test('noTextFallbackMessage: the enriched empty-copy stays mechanism-free (no round/budget/limit/turn wording)', () => {
  const message = noTextFallbackMessage(true, false, false, {
    name: 'get_sca_checks',
    args: { agent_id: '003', policy_id: 'cis_ubuntu22-04', limit: 20 },
  });
  assert.doesNotMatch(message, /\b(round|budget|limit|turn)\b/i);
});

test('noTextFallbackMessage: omitting lastToolCall (no attempt on record) falls back to the base sentence unchanged', () => {
  const message = noTextFallbackMessage(true, false, false);
  assert.equal(message, 'No matching results were found for that query.');
});
