import { useState } from 'react';
import { exportSearchToCSV } from '../../data-grid';

export const useExportResults = ({ indexPattern, exportFilters, query, visibleColumns, results, sorting }) => {
  const [isExporting, setIsExporting] = useState(false);

  const onClickExportResults = async () => {
    try {
      setIsExporting(true);
      await exportSearchToCSV({
        indexPattern,
        filters: exportFilters,
        query,
        fields: visibleColumns,
        pagination: { pageIndex: 0, pageSize: results.hits.total },
        sorting,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, onClickExportResults };
};
