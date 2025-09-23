import { DashboardPanelState } from '../../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../../src/plugins/embeddable/public';
import { getVisStateMetric } from '../../../../it-hygiene/common/saved-vis/generators';
import { checkResultColors, decimalFormat } from './visualization-helpers';
import { CheckResult } from '../../../utils/constants';

// Here we are using vega visualization: https://vega.github.io/vega/
const checkScore = (indexPatternId: string) => ({
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  data: [
    {
      name: 'scoredata',
      url: {
        '%context%': true,
        index: indexPatternId,
        body: {
          size: 0,
          aggs: {
            passed: {
              filter: {
                term: {
                  'check.result': CheckResult.Passed,
                },
              },
            },
            failed: {
              filter: {
                term: {
                  'check.result': CheckResult.Failed,
                },
              },
            },
          },
        },
      },
      format: {
        property: 'aggregations',
      },
      transform: [
        {
          type: 'formula',
          as: 'score',
          expr: '(datum.passed.doc_count + datum.failed.doc_count)? (datum.passed.doc_count / (datum.passed.doc_count + datum.failed.doc_count)) * 100 : 0',
        },
      ],
    },
  ],
  marks: [
    {
      type: 'text',
      from: { data: 'scoredata' },
      encode: {
        enter: {
          x: { signal: 'width / 2' },
          y: { signal: 'height / 1.5' },
          align: { value: 'center' },
          baseline: { value: 'bottom' },
          text: { signal: `format(datum.score, '${decimalFormat()}') + '%'` },
          fontSize: { value: 53.333 },
          fontWeight: { value: 700 },
          font: {
            value:
              '"Inter UI", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
          },
          fill: { value: checkResultColors().checkScoreColor },
        },
      },
    },
    {
      type: 'text',
      from: { data: 'scoredata' },
      encode: {
        enter: {
          x: { signal: 'width / 2' },
          y: { signal: 'height / 2 + 30' },
          align: { value: 'center' },
          baseline: { value: 'top' },
          text: { value: 'Score' },
          fontSize: { value: 16 },
          fill: { value: checkResultColors().checkScoreColor },
        },
      },
    },
  ],
});

export const getKPIsPanel = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    '1': {
      gridData: { w: 12, h: 6, x: 0, y: 0, i: '1' },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateMetric(indexPatternId, {
          id: 'check_result_passed',
          title: 'Checks passed',
          colors: checkResultColors(),
          colorSchema: 'Greens',
          useRanges: true,
          aggsQuery: [
            {
              input: {
                query: `check.result: "${CheckResult.Passed}"`,
                language: 'kuery',
              },
              label: CheckResult.Passed,
            },
          ],
        }),
      },
    },
    '2': {
      gridData: { w: 12, h: 6, x: 12, y: 0, i: '2' },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateMetric(indexPatternId, {
          id: 'check_result_failed',
          title: 'Checks failed',
          colors: checkResultColors(),
          colorSchema: 'Reds',
          aggsQuery: [
            {
              input: {
                query: `check.result: "${CheckResult.Failed}"`,
                language: 'kuery',
              },
              label: CheckResult.Failed,
            },
          ],
        }),
      },
    },
    '3': {
      gridData: { w: 12, h: 6, x: 24, y: 0, i: '3' },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateMetric(indexPatternId, {
          id: 'check_result_not_run',
          title: 'Checks not run',
          colors: checkResultColors(),
          colorSchema: 'Blues',
          aggsQuery: [
            {
              input: {
                query: `check.result: "${CheckResult.NotRun}"`,
                language: 'kuery',
              },
              label: CheckResult.NotRun,
            },
          ],
        }),
      },
    },
    '4': {
      gridData: { w: 12, h: 6, x: 36, y: 0, i: '4' },
      type: 'visualization',
      explicitInput: {
        id: '4',
        savedVis: {
          id: '4',
          type: 'vega',
          params: {
            spec: JSON.stringify(checkScore(indexPatternId)),
          },
        },
      },
    },
  };
};
