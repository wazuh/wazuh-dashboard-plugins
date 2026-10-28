import { itHygieneFindingsColumns } from './it-hygiene-findings-columns';

describe('itHygieneFindingsColumns', () => {
  it('lists when, where and what changed', () => {
    expect(itHygieneFindingsColumns.map(({ id }) => id)).toEqual([
      '@timestamp',
      'wazuh.agent.id',
      'wazuh.agent.name',
      'wazuh.rule.title',
      'event.action',
      'package.name',
      'user.target.name',
      'group.name',
      'service.name',
    ]);
  });

  it('sorts by timestamp descending by default', () => {
    expect(itHygieneFindingsColumns[0]).toMatchObject({
      id: '@timestamp',
      isSortable: true,
      defaultSortDirection: 'desc',
    });
  });
});
