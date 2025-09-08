import * as FileSaver from '../../../../../services/file-saver';

/**
 * File utilities related to DevTools exports.
 */
export class FileService {
  saveJson(filename: string, content: string) {
    const blob = new Blob([content], { type: 'application/json' });
    FileSaver.saveAs?.(blob, filename);
  }
}
