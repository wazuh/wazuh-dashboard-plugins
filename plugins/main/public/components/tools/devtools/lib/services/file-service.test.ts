import { FileService } from './file-service';

jest.mock('../../../../../services/file-saver', () => ({
  saveAs: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const FileSaver = require('../../../../../services/file-saver');

describe('FileService', () => {
  it('crea un Blob JSON y llama a saveAs (happy path)', async () => {
    const service = new FileService();
    const filename = 'export.json';
    const json = '{"a":1}';

    service.saveJson(filename, json);

    expect(FileSaver.saveAs).toHaveBeenCalledTimes(1);
    const [blobArg, nameArg] = (FileSaver.saveAs as jest.Mock).mock.calls[0];
    expect(nameArg).toBe(filename);
    expect(blobArg).toBeInstanceOf(Blob);
    expect((blobArg as Blob).type).toBe('application/json');

    // Validar contenido cuando el entorno lo soporta
    if (typeof (blobArg as any).text === 'function') {
      await expect((blobArg as any).text()).resolves.toBe(json);
    }
  });
});

