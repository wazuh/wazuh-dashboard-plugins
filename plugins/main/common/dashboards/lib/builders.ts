// @ts-ignore
import { Filter } from 'src/plugins/data/common';
import type { GridDataVisualizationPair, SavedVis } from '../types';
import { DASHBOARD_WIDTH_LIMIT, HEIGHT, TYPES } from './constants';
import {
  DashboardLayoutDefinition,
  DashboardPanelBuilderService,
} from './dashboard-config-service';

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
      type: TYPES.INDEX_PATTERN,
      id: indexPatternId,
    },
  ];
}

class KPIsDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(savedVises: SavedVis[]) {
    super();

    if (!savedVises.length) {
      return;
    }

    const width = DASHBOARD_WIDTH_LIMIT / savedVises.length;
    const gridVisualizationPairs: GridDataVisualizationPair[] = savedVises.map(
      (savedVis, currentIndex) => ({
        gridData: {
          w: width,
          h: HEIGHT,
          x: width * currentIndex,
          y: 0,
        },
        savedVis,
      }),
    );

    this.setGridVisualizationPairs(...gridVisualizationPairs);
  }
}

export const buildDashboardKPIPanels = (savedVises: SavedVis[]) => {
  if (!savedVises.length) {
    return {};
  }

  const layoutDefinition = new KPIsDashboardLayoutDefinition(savedVises);
  const panelBuilderService = new DashboardPanelBuilderService(
    layoutDefinition,
  );

  return panelBuilderService.getDashboardPanels();
};
