// @ts-ignore
import { Filter } from 'src/plugins/data/common';
import type { DashboardByValueSavedVis } from '../types';
import { DASHBOARD_WIDTH_LIMIT, HEIGHT } from './constants';

export function buildSearchSource(
  indexPatternId: string,
  { filter = [] }: { filter?: Filter[] } = {},
) {
  return {
    query: {
      query: '',
      language: 'kuery',
    },
    filter,
    index: indexPatternId,
  };
}

export function buildIndexPatternReferenceList(indexPatternId: string) {
  return [
    {
      name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
      type: 'index-pattern',
      id: indexPatternId,
    },
  ];
}

export const generateVisualization = ({
  key,
  width,
  height,
  positionX,
  positionY,
  savedVis,
}: {
  key: string;
  /* MAX: 48 */
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  savedVis: DashboardByValueSavedVis;
}) => {
  if (width > 48) {
    throw new Error('Width cannot exceed 48');
  }

  return {
    [key]: {
      gridData: {
        w: width,
        h: height,
        x: positionX,
        y: positionY,
        i: key,
      },
      type: 'visualization',
      explicitInput: {
        id: key,
        savedVis,
      },
    },
  };
};

export const buildDashboardKPIPanels = (savedVises: DashboardByValueSavedVis[]) => {
  const width = DASHBOARD_WIDTH_LIMIT / savedVises.length;
  return savedVises.reduce((acc, savedVis, currentIndex) => {
    return {
      ...acc,
      ...generateVisualization({
        key: savedVis.id + currentIndex.toString(),
        width: width,
        height: HEIGHT,
        positionX: width * currentIndex,
        positionY: 0,
        savedVis,
      }),
    };
  }, {});
};
