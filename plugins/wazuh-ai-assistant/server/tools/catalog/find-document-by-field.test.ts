import assert from 'node:assert/strict';
import { findDocumentByFieldTool } from './find-document-by-field';
import { WAZUH_FIELD } from '../../../common/wazuh-fields';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return findDocumentByFieldTool.buildRequest(params) as IndexerRequest;
}

test('find_document_by_field: findings index ORs _id with wazuh.rule.id, wazuh.event.id, and event.doc_id (single value -> term)', () => {
  const request = build({
    index_pattern: 'wazuh-findings-v5-*',
    values: ['oPoOs58B4OP1Z0luRhFX'],
  });
  assert.equal(request.index, 'wazuh-findings-v5*');
  assert.deepEqual(request.body.query, {
    bool: {
      should: [
        { ids: { values: ['oPoOs58B4OP1Z0luRhFX'] } },
        { term: { [WAZUH_FIELD.RULE_ID]: 'oPoOs58B4OP1Z0luRhFX' } },
        { term: { 'wazuh.event.id': 'oPoOs58B4OP1Z0luRhFX' } },
        { term: { 'event.doc_id': 'oPoOs58B4OP1Z0luRhFX' } },
      ],
      minimum_should_match: 1,
    },
  });
});

test('find_document_by_field: events index only ORs _id with wazuh.event.id (multiple values -> terms)', () => {
  const request = build({
    index_pattern: 'wazuh-events-v5-*',
    values: ['id-1', 'id-2'],
  });
  assert.equal(request.index, 'wazuh-events-v5*');
  assert.deepEqual(request.body.query, {
    bool: {
      should: [
        { ids: { values: ['id-1', 'id-2'] } },
        { terms: { 'wazuh.event.id': ['id-1', 'id-2'] } },
      ],
      minimum_should_match: 1,
    },
  });
});

test('find_document_by_field: states index ORs _id with vulnerability.id', () => {
  const request = build({
    index_pattern: 'wazuh-states-*',
    values: ['CVE-2024-1234'],
  });
  assert.equal(request.index, 'wazuh-states*');
  assert.deepEqual(request.body.query, {
    bool: {
      should: [
        { ids: { values: ['CVE-2024-1234'] } },
        { term: { 'vulnerability.id': 'CVE-2024-1234' } },
      ],
      minimum_should_match: 1,
    },
  });
});

test('find_document_by_field: rejects an invalid index_pattern', () => {
  assert.throws(
    () => build({ index_pattern: 'wazuh-alerts-*', values: ['abc'] }),
    /must be one of/,
  );
});

test('find_document_by_field: rejects an empty "values" array', () => {
  assert.throws(
    () => build({ index_pattern: 'wazuh-findings-v5-*', values: [] }),
    /non-empty array/,
  );
});

test('find_document_by_field: clamps limit to the [1, 500] range', () => {
  const request = build({
    index_pattern: 'wazuh-findings-v5-*',
    values: ['abc'],
    limit: 5000,
  });
  assert.equal(request.body.size, 500);
});
