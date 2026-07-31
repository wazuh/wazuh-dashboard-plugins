import assert from 'node:assert/strict';
import { getComplianceSummaryTool } from './get-compliance-summary';
import { lintDsl, checkIndexAllowlist } from '../guardrails';
import { COMPLIANCE_FRAMEWORK_FIELDS } from '../../../common/wazuh-fields';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getComplianceSummaryTool.buildRequest(params) as IndexerRequest;
}

test('get_compliance_summary: throws when framework is missing or empty', () => {
  assert.throws(() => build({}));
  assert.throws(() => build({ framework: [] }));
});

test('get_compliance_summary: throws when more than 5 frameworks are requested', () => {
  assert.throws(() =>
    build({
      framework: [
        'cmmc',
        'fedramp',
        'gdpr',
        'hipaa',
        'iso_27001',
        'nis2',
      ],
    }),
  );
});

test('get_compliance_summary: builds one terms agg per requested framework', () => {
  const request = build({ framework: ['gdpr', 'hipaa'] });
  assert.deepEqual(request.body.aggs, {
    gdpr_requirements: {
      terms: { field: COMPLIANCE_FRAMEWORK_FIELDS.gdpr, size: 20 },
    },
    hipaa_requirements: {
      terms: { field: COMPLIANCE_FRAMEWORK_FIELDS.hipaa, size: 20 },
    },
  });
  assert.equal(request.body.size, 0);
});

test('get_compliance_summary: exclude_framework adds a must_not of exists clauses', () => {
  const request = build({
    framework: ['hipaa', 'iso_27001'],
    exclude_framework: ['gdpr'],
  });
  assert.deepEqual(request.body.query.bool.must_not, [
    { exists: { field: COMPLIANCE_FRAMEWORK_FIELDS.gdpr } },
  ]);
});

test('get_compliance_summary: omitting exclude_framework produces no must_not clause', () => {
  const request = build({ framework: ['pci_dss'] });
  assert.equal('must_not' in request.body.query.bool, false);
});

test('get_compliance_summary: clamps limit to the [1, 100] range', () => {
  const request = build({ framework: ['gdpr'], limit: 9999 });
  assert.equal(request.body.aggs.gdpr_requirements.terms.size, 100);
  const requestLow = build({ framework: ['gdpr'], limit: 0 });
  assert.equal(requestLow.body.aggs.gdpr_requirements.terms.size, 1);
});

test('get_compliance_summary: request passes checkIndexAllowlist and lintDsl', () => {
  const request = build({
    framework: ['hipaa', 'iso_27001'],
    exclude_framework: ['gdpr'],
  });
  assert.equal(checkIndexAllowlist(request.index).ok, true);
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});
