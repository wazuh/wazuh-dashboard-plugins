import { DATA_SOURCE_FILTER_CONTROLLED_IT_HYGIENE_RULE_GROUP } from '../../../../../../../common/constants';
import {
  ITHygieneFindingsDataSource,
  IT_HYGIENE_GROUP_KEY,
  IT_HYGIENE_GROUP_VALUE,
} from './it-hygiene-findings-data-source';

describe('ITHygieneFindingsDataSource', () => {
  const dataSource = new ITHygieneFindingsDataSource('test-id', 'test-title');

  beforeEach(() => {
    jest.spyOn(dataSource, 'getClusterFilters').mockReturnValue([]);
    jest.spyOn(dataSource, 'getPinnedAgentFilter').mockReturnValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds a controlled filter on the IT Hygiene integration name', () => {
    const [filter] = dataSource.getRuleGroupsFilter();

    expect(IT_HYGIENE_GROUP_KEY).toBe('wazuh.integration.name');
    expect(IT_HYGIENE_GROUP_VALUE).toBe('wazuh-it-hygiene');
    expect(filter.meta).toMatchObject({
      key: IT_HYGIENE_GROUP_KEY,
      value: IT_HYGIENE_GROUP_VALUE,
      negate: false,
      controlledBy: DATA_SOURCE_FILTER_CONTROLLED_IT_HYGIENE_RULE_GROUP,
    });
  });

  it('includes the IT Hygiene filter in the fixed filters', () => {
    const fixedFilters = dataSource.getFixedFilters();

    expect(
      fixedFilters.some(
        filter =>
          filter.meta.controlledBy ===
          DATA_SOURCE_FILTER_CONTROLLED_IT_HYGIENE_RULE_GROUP,
      ),
    ).toBe(true);
  });
});
