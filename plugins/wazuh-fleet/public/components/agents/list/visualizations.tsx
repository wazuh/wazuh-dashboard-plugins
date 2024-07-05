import React from 'react';
import { ViewMode } from '../../../../../../src/plugins/embeddable/public';
import { getPlugins } from '../../../plugin-services';

const getVisTopOS = (indexPatternId: string) => {
  return getPieVis(indexPatternId, 'host.os.platform', 'Top 5 OS', 'top_5_os');
};

const getVisTopGroups = (indexPatternId: string) => {
  return getPieVis(
    indexPatternId,
    'agent.groups',
    'Top 5 Groups',
    'top_5_groups',
  );
};

const getVisTopAgentByNode = (indexPatternId: string) => {
  return getPieVis(
    indexPatternId,
    'agent.node_name',
    'Top 5 Agents by Node',
    'top_5_agents_by_node',
  );
};

const getPieVis = (
  indexPatternId: string,
  field: string,
  title: string,
  id: string,
) => {
  return {
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
  };
};

const VIS_HEIGHT = 10;
const VIS_WIDTH = 16;

const PANEL_VIS_INDEX = 1;

export const getKPIsPanel = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
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
        savedVis: getVisTopOS(indexPatternId),
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
        savedVis: getVisTopGroups(indexPatternId),
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
        savedVis: getVisTopAgentByNode(indexPatternId),
      },
    },
  };
};

export const AgentsVisualizations = () => {
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
          panels: getKPIsPanel('wazuh-fleet-agents-*'),
          isFullScreenMode: false,
          filters: [],
          useMargins: true,
          id: 'agents-visualizations',
          /*timeRange: {
                      from: searchBarProps.dateRangeFrom,
                      to: searchBarProps.dateRangeTo,
                    },*/
          title: 'KPIs Agents dashboard',
          description: 'KPIs Dashboard of Agents',
          //query: searchBarProps.query,
          refreshConfig: {
            pause: false,
            value: 15,
          },
        }}
      />
    </>
  );
};
