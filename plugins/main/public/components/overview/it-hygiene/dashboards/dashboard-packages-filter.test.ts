import { getDashboardTables } from './dashboard-tables';
import { getDashboardKPIs } from './dashboard-kpi';

const INDEX_PATTERN_ID = 'wazuh-states-inventory-*';

type PanelInput = {
  savedVis: { data: { searchSource: { filter: unknown[] } } };
};

const packagesIndexFilter = expect.objectContaining({
  wildcard: { _index: 'wazuh-states-inventory-packages-*' },
  meta: expect.objectContaining({ negate: false, disabled: false }),
});

describe('IT Hygiene dashboard package panels', () => {
  it('Top 5 installed packages only counts the packages index', () => {
    const { savedVis } = getDashboardTables(INDEX_PATTERN_ID).t1
      .explicitInput as unknown as PanelInput;

    expect(savedVis.data.searchSource.filter).toEqual([packagesIndexFilter]);
  });

  it('Package types only counts the packages index', () => {
    const { savedVis } = getDashboardKPIs(INDEX_PATTERN_ID).s2
      .explicitInput as unknown as PanelInput;

    expect(savedVis.data.searchSource.filter).toEqual([packagesIndexFilter]);
  });
});
