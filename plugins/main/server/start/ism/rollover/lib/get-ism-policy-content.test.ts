import { ISM_ROLLOVER_POLICY_FILE } from '../../../../../common/constants';
import { generateISMPolicyWithContent } from './get-ism-policy-content';
import fs from 'fs';

describe('Generate roll over ISM policy from content', () => {
  let content;

  beforeEach(() => {
    content = JSON.parse(
      fs.readFileSync(ISM_ROLLOVER_POLICY_FILE, {
        encoding: 'utf-8',
      }),
    );
  });

  it.each`
    params                                                                                                                                                                                                                        | result
    ${{ rolloverMinPrimaryShardSize: 14, rolloverMinIndexAge: '20d', rolloverMinDocCount: 210000000, indexPatterns: ['wazuh-alerts-*', 'wazuh-archives-*'], priority: 10, policyID: 'rollover-wazuh-policy' }}                    | ${{ _id: 'rollover-wazuh-policy', policy: { policy: { description: 'Wazuh rollover and alias policy', default_state: 'active', states: [{ name: 'active', actions: [{ rollover: { min_primary_shard_size: '14gb', min_index_age: '20d', min_doc_count: 210000000 } }] }], ism_template: { index_patterns: ['wazuh-alerts-*', 'wazuh-archives-*'], priority: 10 } } } }}
    ${{ rolloverMinPrimaryShardSize: 30, rolloverMinIndexAge: '60d', rolloverMinDocCount: 300000000, indexPatterns: ['wazuh-alerts-*', 'wazuh-archives-*', 'custom-alerts-*'], priority: 20, policyID: 'rollover-wazuh-policy' }} | ${{ _id: 'rollover-wazuh-policy', policy: { policy: { description: 'Wazuh rollover and alias policy', default_state: 'active', states: [{ name: 'active', actions: [{ rollover: { min_primary_shard_size: '30gb', min_index_age: '60d', min_doc_count: 300000000 } }] }], ism_template: { index_patterns: ['wazuh-alerts-*', 'wazuh-archives-*', 'custom-alerts-*'], priority: 20 } } } }}
  `('Generate roll over ISM policy from content', ({ params, result }) => {
    const expectation = generateISMPolicyWithContent(content, params);
    expect(expectation).toEqual(result);
  });
});
