import assert from 'node:assert/strict';
import { getComplianceAlertsTool } from './get-compliance-alerts';
import { lintDsl, checkIndexAllowlist } from '../guardrails';
import { COMPLIANCE_FRAMEWORK_FIELDS } from '../../../common/wazuh-fields';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getComplianceAlertsTool.buildRequest(params) as IndexerRequest;
}

test('get_compliance_alerts: throws when framework is missing or empty', () => {
  assert.throws(() => build({}));
  assert.throws(() => build({ framework: [] }));
});

test('get_compliance_alerts: single framework uses a plain exists clause', () => {
  const request = build({ framework: ['gdpr'] });
  assert.deepEqual(request.body.query.bool.filter[0], {
    exists: { field: COMPLIANCE_FRAMEWORK_FIELDS.gdpr },
  });
  assert.equal('must_not' in request.body.query.bool, false);
});

test('get_compliance_alerts: multiple frameworks OR via should/minimum_should_match', () => {
  const request = build({ framework: ['hipaa', 'iso_27001'] });
  assert.deepEqual(request.body.query.bool.filter[0], {
    bool: {
      should: [
        { exists: { field: COMPLIANCE_FRAMEWORK_FIELDS.hipaa } },
        { exists: { field: COMPLIANCE_FRAMEWORK_FIELDS.iso_27001 } },
      ],
      minimum_should_match: 1,
    },
  });
});

test('get_compliance_alerts: exclude_framework adds a must_not of exists clauses', () => {
  const request = build({
    framework: ['hipaa', 'iso_27001'],
    exclude_framework: ['gdpr'],
  });
  assert.deepEqual(request.body.query.bool.must_not, [
    { exists: { field: COMPLIANCE_FRAMEWORK_FIELDS.gdpr } },
  ]);
});

test('get_compliance_alerts: omitting exclude_framework produces no must_not clause', () => {
  const request = build({ framework: ['pci_dss'] });
  assert.equal('must_not' in request.body.query.bool, false);
});

test('get_compliance_alerts: exclude_framework with multiple frameworks lists them all', () => {
  const request = build({
    framework: ['pci_dss'],
    exclude_framework: ['gdpr', 'hipaa'],
  });
  assert.deepEqual(request.body.query.bool.must_not, [
    { exists: { field: COMPLIANCE_FRAMEWORK_FIELDS.gdpr } },
    { exists: { field: COMPLIANCE_FRAMEWORK_FIELDS.hipaa } },
  ]);
});

test('get_compliance_alerts: clamps limit to the [1, 500] range', () => {
  assert.equal(build({ framework: ['gdpr'], limit: 9999 }).body.size, 500);
  assert.equal(build({ framework: ['gdpr'], limit: 0 }).body.size, 1);
});

test('get_compliance_alerts: request passes checkIndexAllowlist and lintDsl', () => {
  const request = build({
    framework: ['hipaa', 'iso_27001'],
    exclude_framework: ['gdpr'],
  });
  assert.equal(checkIndexAllowlist(request.index).ok, true);
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});
