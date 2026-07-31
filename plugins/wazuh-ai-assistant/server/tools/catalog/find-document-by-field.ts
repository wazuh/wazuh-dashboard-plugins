import { WAZUH_FIELD } from '../../../common/wazuh-fields';
import { ToolDefinition } from '../types';
import { clampLimit, limitProperty, objectSchema } from './common';

const FINDINGS_INDEX = 'wazuh-findings-v5*';
const EVENTS_INDEX = 'wazuh-events-v5*';
const STATES_INDEX = 'wazuh-states*';

/** The business-level UUID field(s) actually meaningful per index family — a finding is also an
 * event (has wazuh.event.id), carries a back-reference to that event's own document id
 * (event.doc_id), plus the rule that matched it (wazuh.rule.id); a raw event only has
 * wazuh.event.id; states (SCA/FIM/inventory/vulnerabilities) only have vulnerability.id on
 * guardrails.ts's ID_FIELD_ALLOWLIST. `_id` (the OpenSearch document id) always applies and is
 * handled separately via an `ids` query, not listed here. */
const INDEX_ID_FIELDS: Record<string, readonly string[]> = {
  [FINDINGS_INDEX]: [WAZUH_FIELD.RULE_ID, 'wazuh.event.id', 'event.doc_id'],
  [EVENTS_INDEX]: ['wazuh.event.id'],
  [STATES_INDEX]: ['vulnerability.id'],
};

/**
 * Looks up documents by exact ID WITHOUT asking the model which field to match. An earlier
 * version required the model to also pick a `field` param ("_id" vs. a business-level UUID
 * field) — with a weak/small model this was observed to fail (a hallucinated field name, or the
 * wrong field for the question's phrasing). Instead, `buildRequest` ORs an `ids` query on `_id`
 * together with a `term`/`terms` clause on every business-level ID field that actually applies to
 * the chosen index (`INDEX_ID_FIELDS` above) — whichever one the value actually is, it matches.
 * This is safe because every field involved is exact-match only (never full-text) and already
 * vetted on `guardrails.ts`'s `ID_FIELD_ALLOWLIST`; `isExactIdLookupQuery` there already accepts a
 * `bool.should` of `term`/`terms`/`ids` clauses, so no guardrail change was needed for this shape.
 * `index_pattern` stays the model's only real decision (a single 3-way enum), which is an easy
 * choice compared to the two-enum combination the earlier `field` param created.
 */
export const findDocumentByFieldTool: ToolDefinition = {
  spec: {
    name: 'find_document_by_field',
    description:
      'Looks up one or more documents by an exact ID value, across findings/events/states data. ' +
      'Automatically matches the ID against every ID field that applies to the chosen index -- ' +
      'no need to know whether it is the document id or a business-level field. Not for ' +
      'free-text or partial matching.',
    parameters: objectSchema(
      {
        index_pattern: {
          type: 'string',
          description:
            'Pick based on the word the user actually used, not on data content: if they say ' +
            '"event" -> "wazuh-events-v5-*" (ALL normalized events, matched or not -- most raw ' +
            'log/telemetry documents live ONLY here, not in findings). If they say "finding"/' +
            '"alert"/"detection" -> "wazuh-findings-v5-*" (only documents that matched a ' +
            'security rule). If they say "vulnerability"/"SCA"/"FIM"/"inventory"/"state" -> ' +
            '"wazuh-states-*". Do not default to findings when the user said "event" -- most ' +
            'events never matched a rule and will not exist there.',
          enum: ['wazuh-findings-v5-*', 'wazuh-events-v5-*', 'wazuh-states-*'],
        },
        values: {
          type: 'array',
          description:
            'One or more exact ID values to match (matches any of them).',
          items: { type: 'string' },
          minItems: 1,
        },
        limit: limitProperty(
          'Max number of documents to return (default 20, max 500).',
        ),
      },
      ['index_pattern', 'values'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const rawIndexPattern = params.index_pattern;
    const indexPattern =
      rawIndexPattern === 'wazuh-findings-v5-*'
        ? FINDINGS_INDEX
        : rawIndexPattern === 'wazuh-events-v5-*'
        ? EVENTS_INDEX
        : rawIndexPattern === 'wazuh-states-*'
        ? STATES_INDEX
        : undefined;
    if (!indexPattern) {
      throw new Error(
        'Parameter "index_pattern" must be one of: "wazuh-findings-v5-*", "wazuh-events-v5-*", ' +
          '"wazuh-states-*".',
      );
    }
    const rawValues = params.values;
    if (
      !Array.isArray(rawValues) ||
      rawValues.length === 0 ||
      !rawValues.every(
        value => typeof value === 'string' && value.trim() !== '',
      )
    ) {
      throw new Error(
        'Parameter "values" is required and must be a non-empty array of strings.',
      );
    }
    const values = rawValues as string[];
    const limit = clampLimit(params.limit, 20, 500);

    const termOrTerms = (field: string) =>
      values.length === 1
        ? { term: { [field]: values[0] } }
        : { terms: { [field]: values } };
    const shouldClauses = [
      { ids: { values } },
      ...INDEX_ID_FIELDS[indexPattern].map(termOrTerms),
    ];
    const query =
      shouldClauses.length === 1
        ? shouldClauses[0]
        : { bool: { should: shouldClauses, minimum_should_match: 1 } };

    return {
      target: 'indexer',
      index: indexPattern,
      body: {
        query,
        sort: ['_doc'],
        size: limit,
      },
    };
  },
  tableSpec: { columns: [] },
  digest: { sampleColumns: [] },
  deriveColumns: true,
};
