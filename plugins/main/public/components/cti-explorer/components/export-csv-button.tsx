import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonEmpty, EuiToolTip } from '@elastic/eui';
import { getToasts } from '../../../kibana-services';
import { useAppConfig } from '../../common/hooks/use-app-config';
import { toCtiRequestError } from '../services/cti-explorer-api';
import {
  buildCsv,
  CsvColumn,
  CsvPageFetcher,
  fetchCsvRecords,
  getCsvRowLimit,
  saveCsv,
} from '../services/export-csv';
import { formatNumber } from '../utils/labels';

interface ExportCsvButtonProps<T> {
  /** Records that match the list: the export holds the same ones. */
  total: number;
  isDisabled?: boolean;
  fetchPage: CsvPageFetcher<T>;
  columns: Array<CsvColumn<T>>;
  /** Without the extension; the date of the export is appended. */
  filename: string;
  'data-test-subj'?: string;
}

/** Exports the records of a list, as filtered, to a CSV file. */
export const ExportCsvButton = <T,>({
  total,
  isDisabled = false,
  fetchPage,
  columns,
  filename,
  'data-test-subj': dataTestSubj,
}: ExportCsvButtonProps<T>) => {
  const [exporting, setExporting] = useState(false);
  const appConfig = useAppConfig();
  const limit = getCsvRowLimit(
    total,
    appConfig?.data?.['reports.csv.maxRows'] as number | undefined,
  );

  const exportCsv = async () => {
    setExporting(true);
    try {
      const items = await fetchCsvRecords(fetchPage, limit);
      const csv = await buildCsv(items, columns);
      saveCsv(csv, `${filename}-${new Date().toISOString().slice(0, 10)}`);
    } catch (error) {
      getToasts().addDanger({
        title: i18n.translate('wazuh.ctiExplorer.exportCsv.error', {
          defaultMessage: 'The CSV file could not be exported',
        }),
        text: toCtiRequestError(error).reason ?? undefined,
      });
    } finally {
      setExporting(false);
    }
  };

  const button = (
    <EuiButtonEmpty
      size='xs'
      iconType='download'
      isLoading={exporting}
      isDisabled={isDisabled || exporting || limit === 0}
      onClick={exportCsv}
      data-test-subj={dataTestSubj}
    >
      {i18n.translate('wazuh.ctiExplorer.exportCsv.button', {
        defaultMessage: 'Export CSV',
      })}
    </EuiButtonEmpty>
  );

  return total > limit && limit > 0 ? (
    <EuiToolTip
      content={i18n.translate('wazuh.ctiExplorer.exportCsv.limitTooltip', {
        defaultMessage:
          'The file holds the first {limit} of the {total} records, in the order of the list.',
        values: { limit: formatNumber(limit), total: formatNumber(total) },
      })}
    >
      {button}
    </EuiToolTip>
  ) : (
    button
  );
};
