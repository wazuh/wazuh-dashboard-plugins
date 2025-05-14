import { SavedVis } from '../types';

export function createSearchSource(
  indexPatternId: string,
): SavedVis['data']['searchSource'] {
  return {
    query: {
      query: '',
      language: 'kuery',
    },
    filter: [],
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
