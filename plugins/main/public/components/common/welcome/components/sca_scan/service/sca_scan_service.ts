import { getPlugins } from '../../../../../../kibana-services';
import { WAZUH_SCA_PATTERN } from '../../../../../../../common/constants';
import { search } from '../../../../search-bar';
import { CheckResult } from '../../../../../overview/sca/utils/constants';

export async function fetchLastPolicies(agentId: string) {
  const indexPattern = await getPlugins().data.indexPatterns.get(
    WAZUH_SCA_PATTERN,
  );

  const response = await search({
    indexPattern,
    filters: [
      {
        meta: { key: 'agent.id', type: 'phrase', value: agentId, disabled: false, negate: false, alias: null },
        query: { match_phrase: { 'agent.id': agentId } },
      },
    ],
    fields: ['policy.name', 'check.result', 'policy.id'],
    pagination: { pageIndex: 0, pageSize: 1000 },
  });

  const hits = response?.hits?.hits || [];
  const grouped = hits.reduce((acc, hit) => {
    const { policy, check } = hit._source;
    if (!policy?.name) return acc;

    const key = policy.name;
    acc[key] = acc[key] || {
      name: policy.name,
      policy_id: policy.id,
      pass: 0,
      fail: 0,
      not_run: 0,
      total: 0,
    };

    const result = (check?.result || '').toLowerCase() as CheckResult;
    if ((Object.values(CheckResult) as string[]).includes(result)) {
      if (result === CheckResult.Passed) acc[key].pass++;
      if (result === CheckResult.Failed) acc[key].fail++;
      if (result === CheckResult.NotRun) acc[key].not_run++;
    }
    acc[key].total++;
    return acc;
  }, {});

  return Object.values(grouped);
}
