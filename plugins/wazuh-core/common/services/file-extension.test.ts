import { getFileExtensionFromBuffer } from './file-extension';
import fs from 'fs';
import path from 'path';

describe('getFileExtensionFromBuffer', () => {
  it.each`
    filepath                                    | extension
    ${'./__fixtures__/fixture_image_small.jpg'} | ${'jpg'}
    ${'./__fixtures__/fixture_image_small.png'} | ${'png'}
    ${'./__fixtures__/fixture_image_big.png'}   | ${'png'}
    ${'./__fixtures__/fixture_image_small.svg'} | ${'svg'}
    ${'./__fixtures__/fixture_file.txt'}        | ${'unknown'}
  `(
    `filepath: $filepath expects to get extension: $extension`,
    ({ extension, filepath }) => {
      const bufferFile = fs.readFileSync(path.join(__dirname, filepath));
      expect(getFileExtensionFromBuffer(bufferFile)).toBe(extension);
    },
  );
});
