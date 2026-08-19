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
  // Discloses that a step was left unreached WITHOUT naming any internal mechanism (product
  // decision, workstream C: no "round"/"budget"/"limit" wording in user-visible copy -- see
  // NO_ANALYSIS_ROUNDS_EXHAUSTED_MESSAGE's doc comment in chat.ts).
  assert.match(message, /ended before a full answer could be written/i);
  assert.doesNotMatch(message, /no additional analysis/i);
  assert.doesNotMatch(message, /\b(round|budget|limit)\b/i);
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

test('D3 fix (AI/plan/d-review.md): search_wazuh_data\'s query_dsl (raw Elasticsearch DSL, declared type "string") never leaks into user-facing empty copy', () => {
  const rawDsl = JSON.stringify({
    query: {
      bool: {
        filter: [{ range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } }],
      },
    },
    size: 20,
    from: 0,
  });
  const message = noTextFallbackMessage(true, false, false, {
    name: 'search_wazuh_data',
    args: { index_pattern: 'wazuh-alerts-*', query_dsl: rawDsl },
  });
  // Only the index_pattern filter (a genuine scalar, user-meaningful) should render; the DSL
  // blob itself -- machine syntax, unbounded length, and liable to contain the literal tokens
  // "limit"/"size" that would otherwise flake the mechanism-silence assertion -- must not.
  assert.match(
    message,
    /\(Searched: wazuh data, filtered to index pattern wazuh-alerts-\*\.\)/,
  );
  assert.doesNotMatch(message, /query dsl/);
  assert.doesNotMatch(message, /"query":\{"bool"/);
});

test('D4 fix (AI/plan/d-review.md): lookup_indicator does not double the word "indicator" (domain and its own filter clause collide)', () => {
  const message = noTextFallbackMessage(true, false, false, {
    name: 'lookup_indicator',
    args: { indicator: '124.70.213.43' },
  });
  // Base: domain resolves to "indicator" (verb-prefix strip), and the sole filter argument is
  // named "indicator" too -- rendering both produced "(Searched: indicator, filtered to
  // indicator 124.70.213.43.)", which reads as a copy bug. The filter clause is dropped when it
  // duplicates the domain, leaving just the domain.
  assert.match(message, /\(Searched: indicator\.\)/);
  assert.doesNotMatch(message, /filtered to indicator/);
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

// --- BLOCKER FIX (empty-answer audit, 2026-08-20, CV-033/CV-066): an errored/rejected call gets --
// --- its own specific error text surfaced, never the generic "no matching results" sentence -----

test(
  'noTextFallbackMessage: an errored call (unknown field, invalid pairing, ...) surfaces its ' +
    'own error text instead of the generic "no matching results" sentence',
  () => {
    const message = noTextFallbackMessage(true, false, false, {
      name: 'get_field_values',
      args: { field: 'os.platform' },
      errorMessage:
        'Parameter "field" ("os.platform") is not one of this tool\'s vetted, bounded-cardinality ' +
        'fields, so its values cannot be enumerated this way. Closest known fields: host.os.platform.',
    });
    assert.doesNotMatch(message, /No matching results were found/);
    assert.match(message, /field values/);
    assert.match(message, /Closest known fields: host\.os\.platform/);
  },
);

test(
  'noTextFallbackMessage: the other recognized shape (invalid field/family pairing) is also ' +
    'classified into user-vocabulary copy',
  () => {
    const message = noTextFallbackMessage(true, false, false, {
      name: 'get_field_values',
      args: {
        field: 'wazuh.agent.host.os.platform',
        index_family: 'inventory_system',
      },
      errorMessage:
        'Parameter "index_family" ("inventory_system") is not valid for field ' +
        '"wazuh.agent.host.os.platform". Valid surfaces for this field: findings, events.',
    });
    assert.doesNotMatch(message, /No matching results were found/);
    assert.match(message, /Valid surfaces for this field: findings, events/);
  },
);

test(
  'noTextFallbackMessage: a genuinely empty successful call (no errorMessage) still uses the ' +
    'plain "no matching results" copy -- the error branch does not swallow the ordinary case',
  () => {
    const message = noTextFallbackMessage(true, false, false, {
      name: 'get_field_values',
      args: { field: 'event.category' },
    });
    assert.match(message, /No matching results were found/);
  },
);

test(
  'noTextFallbackMessage: an overlong (but recognized-shape) error message is truncated with ' +
    'an ellipsis, never dumped verbatim into user-facing copy',
  () => {
    const message = noTextFallbackMessage(true, false, false, {
      name: 'get_field_values',
      args: { field: 'bogus' },
      errorMessage:
        'Parameter "field" ("bogus") is not one of this tool\'s vetted, bounded-cardinality ' +
        `fields, so its values cannot be enumerated this way. Closest known fields: ${'x'.repeat(
          400,
        )}.`,
    });
    assert.ok(message.length < 400);
    assert.match(message, /…/);
  },
);

// --- REVIEW FIX F1 (groupA-regression-review.md, REQUIRED): the error channel is a strict --------
// --- allowlist, never a pass-through -- guardrail/exception text must never reach user copy ------

test(
  'noTextFallbackMessage: a guardrail violation error is NEVER surfaced verbatim -- falls back ' +
    'to the plain "no matching results" copy instead of leaking mechanism vocabulary',
  () => {
    const message = noTextFallbackMessage(true, false, false, {
      name: 'search_wazuh_data',
      args: { index_pattern: 'wazuh-events-v5-*' },
      errorMessage:
        'Aggregation on field "event.action" is not on the allowed low-cardinality field list.',
    });
    assert.match(message, /No matching results were found/);
    assert.doesNotMatch(message, /low-cardinality field list/);
  },
);

test(
  'noTextFallbackMessage: a raw sanitized exception (OpenSearch/Node error text) is NEVER ' +
    'surfaced verbatim -- falls back to the plain "no matching results" copy',
  () => {
    const message = noTextFallbackMessage(true, false, false, {
      name: 'search_wazuh_data',
      args: { index_pattern: 'wazuh-events-v5-*' },
      errorMessage:
        'Indexer query failed: index_not_found_exception [wazuh-bogus-*]',
    });
    assert.match(message, /No matching results were found/);
    assert.doesNotMatch(message, /index_not_found_exception/);
  },
);

test(
  'noTextFallbackMessage: a bounded "which one?" candidate-list error (which may itself carry ' +
    'a pseudonymized identifier) is NEVER surfaced verbatim',
  () => {
    const message = noTextFallbackMessage(true, false, false, {
      name: 'get_sca_checks',
      args: {},
      errorMessage:
        'Parameter "agent_id" was not supplied and could not be resolved automatically. (2 active ' +
        'agents exist, so which one is meant cannot be assumed. Candidates: "HOST_1" (id 001), ' +
        '"HOST_2" (id 002).)',
    });
    assert.match(message, /No matching results were found/);
    assert.doesNotMatch(message, /HOST_1/);
    assert.doesNotMatch(message, /Candidates:/);
  },
);

// --- BLOCKER FIX (backlog CV-017 residual, "stale digest after silent mid-turn error"; ported ----
// --- from deploy commit 872704fd4) -----------------------------------------------------------------
//
// CV-017's live shape: an EARLIER, broader call already rendered a real, non-empty table
// (`sawNonEmptyTable === true`), but the actual LAST call this turn attempted -- a narrower,
// correctly-scoped follow-up the question needed -- errored silently. Before this fix, the
// `sawNonEmptyTable === true` branch of `noTextFallbackMessage` only ever returned the bare
// NO_ANALYSIS_TEXT_MESSAGE/NO_ANALYSIS_ROUNDS_EXHAUSTED_MESSAGE copy ("see the results above"),
// with no hint that the table on screen does not reflect the question actually asked.

test(
  'noTextFallbackMessage: a table already rendered, but the LAST attempted call errored -> ' +
    'admits the more specific lookup did not complete instead of silently standing in for it ' +
    '(CV-017 shape)',
  () => {
    const message = noTextFallbackMessage(true, true, false, {
      name: 'search_wazuh_data',
      args: { index_pattern: '.opensearch-sap-*-findings' },
      errorMessage: 'search_phase_execution_exception: some internal detail',
    });
    assert.match(
      message,
      /no additional analysis/i,
      'still opens with the base "see the results above" sentence',
    );
    assert.match(
      message,
      /did not complete/,
      'and admits the LAST, more specific attempt never completed',
    );
    // The raw exception text is never surfaced -- same allowlist-only policy as
    // `buildNoMatchingResultsMessage`/`classifyToolErrorForFallback` above.
    assert.doesNotMatch(message, /search_phase_execution_exception/);
  },
);

test(
  'noTextFallbackMessage: a table already rendered, LAST attempted call errored with a ' +
    'vetted/classified error -> uses the classified "could not run as asked" phrasing',
  () => {
    const message = noTextFallbackMessage(true, true, false, {
      name: 'get_field_values',
      args: { field: 'os.platform' },
      errorMessage:
        'Parameter "field" ("os.platform") is not one of this tool\'s vetted, bounded-cardinality ' +
        'fields, so its values cannot be enumerated this way. Closest known fields: host.os.platform.',
    });
    assert.match(message, /could not run as asked/);
    assert.match(message, /Closest known fields: host\.os\.platform/);
  },
);

test('noTextFallbackMessage: rounds exhausted AND the last attempt errored -> both clauses appear', () => {
  const message = noTextFallbackMessage(true, true, true, {
    name: 'search_wazuh_data',
    args: {},
    errorMessage: 'some unclassified internal error',
  });
  assert.match(message, /ended before a full answer could be written/i);
  assert.match(message, /did not complete/);
});

test(
  'noTextFallbackMessage: a table already rendered, LAST attempted call succeeded (no ' +
    'errorMessage) -> no errored-attempt clause is added',
  () => {
    const message = noTextFallbackMessage(true, true, false, {
      name: 'get_critical_findings',
      args: {},
    });
    assert.doesNotMatch(message, /did not complete/);
    assert.doesNotMatch(message, /could not run/);
  },
);

test(
  'noTextFallbackMessage: a table already rendered, no lastToolCall on record -> unchanged base ' +
    'sentence, no errored-attempt clause',
  () => {
    const message = noTextFallbackMessage(true, true, false);
    assert.equal(message, 'No additional analysis — see the results above.');
  },
);
