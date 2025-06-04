import { SavedVis } from '../types';

export function createSearchSource(
  indexPatternId: string,
  options: { filter: any[] } = { filter: [] },
): SavedVis['data']['searchSource'] {
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
): SavedVis['data']['references'] {
  return [
    {
      name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
      type: 'index-pattern',
      id: indexPatternId,
    },
  ];
}
