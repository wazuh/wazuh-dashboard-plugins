import { DashboardPanelState } from '../../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../../src/plugins/embeddable/public';
import {
  createBaseVisState,
  createHorizontalBarVis,
} from './visualization-helpers';

export const getVisStateResultsByAgent = (indexPatternId: string) =>
  createHorizontalBarVis(
    'results_by_agent',
    'Agents by check result',
    'agent.name',
    'Agents',
    indexPatternId,
  );

export const getVisStateCheckResultsByPolicy = (indexPatternId: string) =>
  createHorizontalBarVis(
    'policies_by_result',
    'Policies by check result',
    'policy.name',
    'Policies',
    indexPatternId,
  );

/**
 * Policies by agent ID → Heatmap
 */
export const getVisStatePolicyByCheckHeatmap = (indexPatternId: string) =>
  createBaseVisState(
    'policies_by_agent',
    'Policies by agent ID',
    'heatmap',
    {
      type: 'heatmap',
      addTooltip: true,
      addLegend: true,
      enableHover: false,
      legendPosition: 'right',
      times: [],
      colorsNumber: 4,
      colorSchema: 'Reds',
      setColorRange: false,
      colorsRange: [],
      invertColors: false,
      percentageMode: false,
      valueAxes: [
        {
          show: false,
          id: 'ValueAxis-1',
          type: 'value',
          scale: { type: 'linear', defaultYExtents: false },
          labels: {
            show: false,
            rotate: 75,
            overwriteColor: false,
            color: 'black',
            truncate: 20,
          },
        },
      ],
    },
    [
      {
        id: '2',
        enabled: true,
        type: 'terms',
        params: {
          field: 'agent.id',
          orderBy: '1',
          order: 'desc',
          size: 20,
          otherBucket: false,
          otherBucketLabel: 'Other',
          missingBucket: false,
          missingBucketLabel: 'Missing',
          customLabel: 'Checks',
        },
        schema: 'segment',
      },
      {
        id: '3',
        enabled: true,
        type: 'terms',
        params: {
          field: 'policy.name',
          orderBy: '1',
          order: 'desc',
          size: 5,
          otherBucket: false,
          otherBucketLabel: 'Other',
          missingBucket: false,
          missingBucketLabel: 'Missing',
          customLabel: 'Policies',
        },
        schema: 'group',
      },
    ],
    indexPatternId,
  );

/**
 * Overview Dashboard Panels
 */
export const getDashboardPanels = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => ({
  '1': {
    gridData: { w: 24, h: 10, x: 0, y: 0, i: '1' },
    type: 'visualization',
    explicitInput: {
      id: '1',
      savedVis: getVisStateResultsByAgent(indexPatternId),
    },
  },
  '2': {
    gridData: { w: 24, h: 10, x: 24, y: 0, i: '2' },
    type: 'visualization',
    explicitInput: {
      id: '2',
      savedVis: getVisStateCheckResultsByPolicy(indexPatternId),
    },
  },
  '3': {
    gridData: { w: 48, h: 12, x: 0, y: 10, i: '3' },
    type: 'visualization',
    explicitInput: {
      id: '3',
      savedVis: getVisStatePolicyByCheckHeatmap(indexPatternId),
    },
  },
});
