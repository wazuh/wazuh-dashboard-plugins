import React from 'react';
import { DashboardPanelState } from '../../../../../../src/plugins/dashboard/public/application';
import {
  EmbeddableInput,
  ViewMode,
} from '../../../../../../src/plugins/embeddable/public';
import { getPlugins } from '../../../plugin-services';

const getPieVis = (
  indexPatternId: string,
  field: string,
  title: string,
  id: string,
) => ({
  id,
  title,
  type: 'pie',
  params: {
    addLegend: true,
    addTooltip: true,
    isDonut: true,
    labels: {
      last_level: true,
      show: false,
      truncate: 100,
      values: true,
    },
    legendPosition: 'right',
    row: true,
    type: 'pie',
  },
  data: {
    searchSource: {
      query: {
        language: 'kuery',
        query: '',
      },
      filter: [],
      index: indexPatternId,
    },
    references: [
      {
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
        id: indexPatternId,
      },
    ],
    aggs: [
      {
        id: '1',
        enabled: true,
        type: 'count',
        params: {
          customLabel: '',
        },
        schema: 'metric',
      },
      {
        id: '2',
        enabled: true,
        type: 'terms',
        params: {
          field,
          orderBy: '1',
          order: 'desc',
          size: 5,
          otherBucket: false,
          otherBucketLabel: 'Other',
          missingBucket: false,
          missingBucketLabel: 'Missing',
        },
        schema: 'segment',
      },
    ],
  },
});
const getVisTopOS = (indexPatternId: string) =>
  getPieVis(indexPatternId, 'agent.host.os.name', 'Top 5 OS', 'top_5_os');
const getVisTopGroups = (indexPatternId: string) =>
  getPieVis(indexPatternId, 'agent.groups', 'Top 5 Groups', 'top_5_groups');
const getVisStatus = (indexPatternId: string) =>
  getPieVis(
    indexPatternId,
    'agent.status',
    'Agents by Status',
    'agents_status',
  );
const VIS_HEIGHT = 10;
const VIS_WIDTH = 16;

export const getKPIsPanel = (
  indexPatternId: string,
): Record<
  string,
  DashboardPanelState<EmbeddableInput & Record<string, unknown>>
> => ({
  '1': {
    gridData: {
      w: VIS_WIDTH,
      h: VIS_HEIGHT,
      x: 0,
      y: 0,
      i: '1',
    },
    type: 'visualization',
    explicitInput: {
      id: '1',
      savedVis: getVisStatus(indexPatternId),
    },
  },
  '2': {
    gridData: {
      w: VIS_WIDTH,
      h: VIS_HEIGHT,
      x: VIS_WIDTH,
      y: 0,
      i: '2',
    },
    type: 'visualization',
    explicitInput: {
      id: '2',
      savedVis: getVisTopOS(indexPatternId),
    },
  },
  '3': {
    gridData: {
      w: VIS_WIDTH,
      h: VIS_HEIGHT,
      x: VIS_WIDTH * 2,
      y: 0,
      i: '3',
    },
    type: 'visualization',
    explicitInput: {
      id: '3',
      savedVis: getVisTopGroups(indexPatternId),
    },
  },
});

export const AgentsVisualizations = (props: {
  searchBarProps: {
    dateRangeFrom: string;
    dateRangeTo: string;
    query: string;
    filters: any[];
  };
}) => {
  const { searchBarProps } = props;
  const plugins = getPlugins();
  const DashboardByRenderer =
    plugins.dashboard.DashboardContainerByValueRenderer;

  return (
    <>
      <DashboardByRenderer
        input={{
          viewMode: ViewMode.VIEW,
          // Try to use the index pattern that the dataSource has
          // but if it is undefined use the index pattern of the hoc
          // because the first executions of the dataSource are undefined
          // and embeddables need index pattern.
          panels: getKPIsPanel('wazuh-agents*'),
          isFullScreenMode: false,
          filters: searchBarProps.filters,
          useMargins: true,
          id: 'agents-visualizations',
          timeRange: {
            from: searchBarProps.dateRangeFrom,
            to: searchBarProps.dateRangeTo,
          },
          title: 'KPIs Agents dashboard',
          description: 'KPIs Dashboard of Agents',
          query: searchBarProps.query,
          refreshConfig: {
            pause: false,
            value: 15,
          },
        }}
      />
    </>
  );
};
