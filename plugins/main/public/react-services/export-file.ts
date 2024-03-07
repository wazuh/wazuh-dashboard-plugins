import { getToasts } from '../kibana-services';
import * as FileSaver from '../services/file-saver';

interface IExportResponseToFile {
  headers: {
    'content-disposition'?: string;
    'content-type': string;
  };
}
/**
 * Export response data to file
 */
export const exportResponseToFile = async (response: IExportResponseToFile) => {
  // Get the filename from the response headers
  const [_, filename] =
    response?.headers?.['content-disposition']?.match?.(/filename="([^"]+)"/) ||
    [];

  // Create blob
  const blob = new Blob([response.data], {
    type: response.headers['content-type'],
  });

  // Save file from frontend side
  FileSaver.saveAs(blob, filename);

  // Display a toast message
  getToasts().add({
    color: 'success',
    title: 'File downloaded',
    toastLifeTimeMs: 4000,
  });
};
