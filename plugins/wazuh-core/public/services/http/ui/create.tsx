import { fetchServerTableDataCreator } from './services/fetch-server-data';
import { withServices } from './withServices';
import { ExportTableCsv } from './components/export-table-csv';
import * as FileSaver from '../../../utils/file-saver';
import { ServerTableData } from './components/server-table-data';

export const createUI = deps => {
  const serverDataFetch = fetchServerTableDataCreator(
    deps.http.server.request.bind(deps.http.server),
  );

  const ActionExportFormatted = withServices({
    showToast: deps.core.notifications.toasts.add.bind(
      deps.core.notifications.toasts,
    ),
    exportCSV: async (path, filters = [], exportName = 'data') => {
      const data = await deps.http.server.csv(path, filters);
      const output = data.data ? [data.data] : [];
      const blob = new Blob(output, { type: 'text/csv' });
      FileSaver.saveAs(blob, `${exportName}.csv`);
    },
  })(ExportTableCsv);

  return {
    ServerTable: withServices({
      ActionExportFormatted,
      fetchData: serverDataFetch,
    })(ServerTableData),
  };
};
