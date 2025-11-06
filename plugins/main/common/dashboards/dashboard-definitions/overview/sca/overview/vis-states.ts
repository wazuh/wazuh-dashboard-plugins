import {
  createBaseVisState,
  createHorizontalBarVis,
} from '../../../../lib/helpers';

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
