import {
  CTI_MAX_PAGE_SIZE,
  CTI_MAX_RESULT_WINDOW,
} from '../../../../common/cti-explorer/constants';
import * as FileSaver from '../../../services/file-saver';
import {
  buildCsv,
  CsvColumn,
  fetchCsvRecords,
  getCsvRowLimit,
  saveCsv,
} from './export-csv';

jest.mock('../../../services/file-saver', () => ({ saveAs: jest.fn() }));

describe('getCsvRowLimit', () => {
  it.each([
    ['the matches when they are fewer', 42, 10000, 42],
    ['the configured row limit', 5000, 1000, 1000],
    [
      'the result window over a larger limit',
      50000,
      20000,
      CTI_MAX_RESULT_WINDOW,
    ],
    [
      'the result window without a limit',
      50000,
      undefined,
      CTI_MAX_RESULT_WINDOW,
    ],
    ['nothing without matches', 0, 10000, 0],
  ])('returns %s', (_label, total, maxRows, expected) => {
    expect(getCsvRowLimit(total, maxRows)).toBe(expected);
  });
});

describe('fetchCsvRecords', () => {
  it('reads every page up to the limit, in order', async () => {
    const fetchPage = jest.fn((page: number, pageSize: number) =>
      Promise.resolve({
        total: 2500,
        items: Array.from(
          { length: Math.min(pageSize, 2500 - page * pageSize) },
          (_, index) => page * pageSize + index,
        ),
      }),
    );

    const items = await fetchCsvRecords(fetchPage, 2100);

    expect(fetchPage.mock.calls).toEqual([
      [0, CTI_MAX_PAGE_SIZE],
      [1, CTI_MAX_PAGE_SIZE],
      [2, CTI_MAX_PAGE_SIZE],
    ]);
    expect(items).toHaveLength(2100);
    expect(items[0]).toBe(0);
    expect(items[2099]).toBe(2099);
  });

  it('stays within the result window', async () => {
    const fetchPage = jest.fn(() => Promise.resolve({ total: 0, items: [] }));
    await fetchCsvRecords(fetchPage, CTI_MAX_RESULT_WINDOW);
    const calls = fetchPage.mock.calls as unknown as Array<[number, number]>;
    const [lastPage, pageSize] = calls[calls.length - 1];
    expect((lastPage + 1) * pageSize).toBeLessThanOrEqual(
      CTI_MAX_RESULT_WINDOW,
    );
  });

  it('requests nothing for an empty list', async () => {
    const fetchPage = jest.fn();
    expect(await fetchCsvRecords(fetchPage, 0)).toEqual([]);
    expect(fetchPage).not.toHaveBeenCalled();
  });
});

describe('buildCsv', () => {
  const columns: Array<CsvColumn<{ name: string; score: number | null }>> = [
    { field: 'name', title: 'Name', value: item => item.name },
    { field: 'score', title: 'Score', value: item => item.score },
  ];

  it('writes the titles and one row per record, empty for missing values', async () => {
    const csv = await buildCsv(
      [
        { name: 'example.org', score: 80 },
        { name: 'a, b', score: null },
      ],
      columns,
    );
    expect(csv.split('\n')).toEqual([
      'Name,Score',
      'example.org,80',
      '"a, b",',
    ]);
  });

  it('neutralizes values a spreadsheet would run as formulas', async () => {
    const csv = await buildCsv([{ name: '=cmd()', score: 1 }], columns);
    expect(csv.split('\n')[1]).toBe("'=cmd(),1");
  });
});

describe('saveCsv', () => {
  it('saves a CSV file with the given name', () => {
    saveCsv('a,b', 'cti-iocs-2026-11-06');
    expect(FileSaver.saveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      'cti-iocs-2026-11-06.csv',
    );
  });
});
