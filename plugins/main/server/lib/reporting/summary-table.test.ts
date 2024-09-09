import SummaryTable from './summary-table';
import overviewSummaryTableDefinitions from './summary-tables-definitions/overview/index';

describe('Summary table', () => {
  it.skip.each`
    summarySetup                                  | columns
    ${overviewSummaryTableDefinitions.general[0]} | ${['Rule ID', 'Description', 'Level', 'Count']}
  `('get columns from summary setup', ({ summarySetup, columns }) => {
    const summaryTable = new SummaryTable(
      {},
      'now/1h',
      'now',
      [],
      summarySetup,
      'pattern',
    );

    expect(summaryTable._columns).toEqual(columns);
  });

  it.each`
    aggregationsResponse | summarySetup | title | columns | rows
    ${{ '2': {
    doc_count_error_upper_bound: 0,
    sum_other_doc_count: 0,
    buckets: [{
        '3': {
          doc_count_error_upper_bound: 0,
          sum_other_doc_count: 0,
          buckets: [],
        },
        key: '4507',
        doc_count: 5,
      }, {
        '3': {
          doc_count_error_upper_bound: 0,
          sum_other_doc_count: 0,
          buckets: [{
              '4': {
                doc_count_error_upper_bound: 0,
                sum_other_doc_count: 0,
                buckets: [],
              },
              key: '4508 - Description',
              doc_count: 6,
            }],
        },
        key: '4508',
        doc_count: 8,
      }, {
        '3': {
          doc_count_error_upper_bound: 0,
          sum_other_doc_count: 0,
          buckets: [{
              '4': {
                doc_count_error_upper_bound: 0,
                sum_other_doc_count: 0,
                buckets: [{
                    '5': {
                      doc_count_error_upper_bound: 0,
                      sum_other_doc_count: 0,
                      buckets: [],
                    },
                    key: 10,
                    doc_count: 5,
                  }],
              },
              key: '4509 - Description',
              doc_count: 21,
            }],
        },
        key: '4509',
        doc_count: 30,
      }, {
        '3': {
          doc_count_error_upper_bound: 0,
          sum_other_doc_count: 0,
          buckets: [{
              '4': {
                doc_count_error_upper_bound: 0,
                sum_other_doc_count: 0,
                buckets: [{
                    '5': {
                      doc_count_error_upper_bound: 0,
                      sum_other_doc_count: 0,
                      buckets: [],
                    },
                    key: 100,
                    doc_count: 12,
                  }],
              },
              key: '4510 - Description',
              doc_count: 14,
            }],
        },
        key: '4510',
        doc_count: 50,
      }],
  } }} | ${overviewSummaryTableDefinitions.general[0]} | ${'Alerts summary'} | ${['Rule ID', 'Description', 'Level', 'Count']} | ${[['4507', undefined, undefined, 5], ['4508', '4508 - Description', undefined, 6], ['4509', '4509 - Description', 10, 5], ['4510', '4510 - Description', 100, 12]]}
  `(
    'format response to table',
    ({ aggregationsResponse, summarySetup, title, columns, rows }) => {
      const summaryTable = new SummaryTable(
        {},
        'now/1h',
        'now',
        [],
        summarySetup,
        'pattern',
      );

      expect(
        summaryTable._formatResponseToTable(aggregationsResponse).title,
      ).toBe(title);
      expect(
        summaryTable._formatResponseToTable(aggregationsResponse).columns,
      ).toEqual(columns);
      expect(
        summaryTable._formatResponseToTable(aggregationsResponse).rows,
      ).toEqual(rows);
    },
  );
});
