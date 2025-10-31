import { DashboardByValueSavedVis } from '../../../../../../common/dashboards/types';

export function createSearchSource(
  indexPatternId: string,
  options: { filter: any[] } = { filter: [] },
): DashboardByValueSavedVis['data']['searchSource'] {
  const { filter } = options;
  return {
    query: {
      query: '',
      language: 'kuery',
    },
    filter,
    index: indexPatternId,
  };
}

export function createIndexPatternReferences(
  indexPatternId: string,
): DashboardByValueSavedVis['data']['references'] {
  return [
    {
      name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
      type: 'index-pattern',
      id: indexPatternId,
    },
  ];
}
