/**
 * Get the file extension from a file buffer. Calculates the image format by reading the first 4 bytes of the image (header)
 * Supported types: jpeg, jpg, png, svg
 * Additionally, this function allows checking gif images.
 * @param buffer file buffer
 * @returns the file extension. Example: jpg, png, svg. it Returns unknown if it can not find the extension.
*/
export function getFileExtensionFromBuffer(buffer: Buffer): string {
	const imageFormat = buffer.toString('hex').substring(0, 4);
	switch (imageFormat) {
		case '4749':
			return 'gif';
		case 'ffd8':
			return 'jpg'; // Also jpeg
		case '8950':
			return 'png';
    case '3c73':
    case '3c3f':
			return 'svg';
		default:
			return 'unknown';
	}
};
