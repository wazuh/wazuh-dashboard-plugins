import { SCA_CHECK_RESULT } from '../../../../lib';
import {
  getCheckResultColors,
  getDecimalPattern,
} from '../../../../lib/helpers';
import type { SavedVis } from '../../../../types';

const generateCheckScoreVegaVisualization = (indexPatternId: string) => {
  return {
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
                    'check.result': SCA_CHECK_RESULT.PASSED,
                  },
                },
              },
              failed: {
                filter: {
                  term: {
                    'check.result': SCA_CHECK_RESULT.FAILED,
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
            text: {
              signal: `format(datum.score, '${getDecimalPattern()}') + '%'`,
            },
            fontSize: { value: 53.333 },
            fontWeight: { value: 700 },
            font: {
              value:
                '"Inter UI", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
            },
            fill: { value: getCheckResultColors().checkScoreColor },
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
            fill: { value: getCheckResultColors().checkScoreColor },
          },
        },
      },
    ],
  };
};

// Here we are using vega visualization: https://vega.github.io/vega/
export const getVisStateCheckScore = (indexPatternId: string) => {
  return {
    id: 'check_score',
    type: 'vega',
    params: {
      spec: JSON.stringify(generateCheckScoreVegaVisualization(indexPatternId)),
    },
  } as unknown as SavedVis;
};
