import converter from 'json-2-csv';
import * as FileSaver from '../../../services/file-saver';
import { neutralizeCsvFormulaValues } from '../../../../common/services/neutralize-csv-formula';
import {
  CTI_MAX_PAGE_SIZE,
  CTI_MAX_RESULT_WINDOW,
} from '../../../../common/cti-explorer/constants';
import type { CtiSearchResponse } from '../../../../common/cti-explorer/types';

/** One column of an exported file: `field` is the row key, `title` the header. */
export interface CsvColumn<T> {
  field: string;
  title: string;
  value: (item: T) => string | number | null | undefined;
}

export type CsvPageFetcher<T> = (
  page: number,
  pageSize: number,
) => Promise<CtiSearchResponse<T>>;

/**
 * Records an export holds: the matches, up to the configured row limit and the
 * result window of the index, which `from + size` cannot go past.
 */
export const getCsvRowLimit = (total: number, maxRows?: number): number =>
  Math.max(
    0,
    Math.min(
      total,
      maxRows && maxRows > 0 ? maxRows : CTI_MAX_RESULT_WINDOW,
      CTI_MAX_RESULT_WINDOW,
    ),
  );

/** Reads the first `limit` records, one page per request, all requests at once. */
export const fetchCsvRecords = async <T>(
  fetchPage: CsvPageFetcher<T>,
  limit: number,
): Promise<T[]> => {
  const pages = Math.ceil(limit / CTI_MAX_PAGE_SIZE);
  const responses = await Promise.all(
    Array.from({ length: pages }, (_, page) =>
      fetchPage(page, CTI_MAX_PAGE_SIZE),
    ),
  );
  return responses.flatMap(response => response.items).slice(0, limit);
};

/** CSV of the records, with the values that a spreadsheet would run as formulas neutralized. */
export const buildCsv = <T>(
  items: T[],
  columns: Array<CsvColumn<T>>,
): Promise<string> => {
  const rows = items.map(item =>
    Object.fromEntries(
      columns.map(column => [column.field, column.value(item) ?? '']),
    ),
  );
  return converter.json2csvAsync(neutralizeCsvFormulaValues(rows), {
    emptyFieldValue: '',
    keys: columns.map(({ field, title }) => ({ field, title })),
  });
};

export const saveCsv = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv' });
  FileSaver.saveAs(blob, `${filename}.csv`);
};
