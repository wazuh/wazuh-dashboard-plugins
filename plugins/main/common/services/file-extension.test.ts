import { getFileExtensionFromBuffer } from "./file-extension";
import fs from 'fs';
import path from 'path';

describe('getFileExtensionFromBuffer', () => {
	it.each`
		filepath                                                              | extension
		${'../../server/routes/wazuh-utils/fixtures/fixture_image_small.jpg'} | ${'jpg'}
		${'../../server/routes/wazuh-utils/fixtures/fixture_image_small.png'} | ${'png'}
		${'../../server/routes/wazuh-utils/fixtures/fixture_image_big.png'}   | ${'png'}
		${'../../server/routes/wazuh-utils/fixtures/fixture_image_small.svg'} | ${'svg'}
		${'../../server/routes/wazuh-utils/fixtures/fixture_file.txt'}        | ${'unknown'}
		`(`filepath: $filepath expects to get extension: $extension`, ({ extension, filepath }) => {
			const bufferFile = fs.readFileSync(path.join(__dirname, filepath));
			expect(getFileExtensionFromBuffer(bufferFile)).toBe(extension);
    });
});
