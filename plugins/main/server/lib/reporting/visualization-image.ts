import zlib from 'zlib';

// Limits of the report visualization images. The reporting client captures each
// panel at its CSS size, so real images stay far below them.
export const MAX_VISUALIZATION_IMAGE_WIDTH = 8192;
export const MAX_VISUALIZATION_IMAGE_HEIGHT = 4096;
export const MAX_VISUALIZATION_IMAGES = 100;
// Bounds the memory and CPU the PDF library uses to decode the images of a report
export const MAX_VISUALIZATION_IMAGES_TOTAL_PIXELS = 32 * 1024 * 1024;

const PNG_DATA_URI_PREFIX = 'data:image/png;base64,';
const PNG_DATA_URI_REGEX = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
// Signature and IHDR chunk: 33 bytes, which are exactly 44 base64 characters
const PNG_HEADER_LENGTH = 33;
const PNG_HEADER_BASE64_LENGTH = 44;
// Bytes per pixel of the 8-bit PNG color types that need no palette:
// grayscale (0), RGB (2), grayscale with alpha (4) and RGBA (6)
const BYTES_PER_PIXEL: Record<number, number> = { 0: 1, 2: 3, 4: 2, 6: 4 };
const MAX_PNG_FILTER_TYPE = 4;

const FORMAT_MESSAGE = 'must be a base64-encoded PNG data URI';
const SIZE_MESSAGE =
  `must be at most ${MAX_VISUALIZATION_IMAGE_WIDTH}x` +
  `${MAX_VISUALIZATION_IMAGE_HEIGHT} pixels`;

interface PNGHeader {
  width: number;
  height: number;
  bytesPerPixel: number;
}

/**
 * Read the PNG header and check that the image has a supported format and size.
 * Returns the header or the validation error message.
 */
function readPNGHeader(png: Buffer): PNGHeader | string {
  if (
    png.length < PNG_HEADER_LENGTH ||
    !png.subarray(0, 8).equals(PNG_SIGNATURE) ||
    png.toString('latin1', 12, 16) !== 'IHDR'
  ) {
    return FORMAT_MESSAGE;
  }
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const [bitDepth, colorType, , , interlaceMethod] = png.subarray(24, 29);
  const bytesPerPixel = BYTES_PER_PIXEL[colorType];
  if (!bytesPerPixel || bitDepth !== 8 || interlaceMethod !== 0) {
    return 'must be an 8-bit, non-interlaced and non-palette PNG';
  }
  if (
    !width ||
    !height ||
    width > MAX_VISUALIZATION_IMAGE_WIDTH ||
    height > MAX_VISUALIZATION_IMAGE_HEIGHT
  ) {
    return SIZE_MESSAGE;
  }
  return { width, height, bytesPerPixel };
}

/**
 * Read the header of a visualization image data URI decoding only its first
 * bytes, so it is cheap regardless of the image size.
 */
function readImageHeader(value: unknown): PNGHeader | string {
  if (typeof value !== 'string' || !PNG_DATA_URI_REGEX.test(value)) {
    return FORMAT_MESSAGE;
  }
  return readPNGHeader(
    Buffer.from(
      value.slice(
        PNG_DATA_URI_PREFIX.length,
        PNG_DATA_URI_PREFIX.length + PNG_HEADER_BASE64_LENGTH,
      ),
      'base64',
    ),
  );
}

/**
 * Check that the PNG can be decoded by the PDF library without throwing outside
 * of the report generation promise: image data that inflates to exactly the
 * expected size with valid row filters.
 */
function isDecodablePNG(png: Buffer): boolean {
  const header = readPNGHeader(png);
  if (typeof header === 'string') {
    return false;
  }
  const { width, height, bytesPerPixel } = header;

  // Read the chunks as the PDF library does: it stops at IEND and ignores the
  // image data after it
  const imageData: Buffer[] = [];
  let hasEnd = false;
  for (let pos = 8; pos + 8 <= png.length; ) {
    const length = png.readUInt32BE(pos);
    const type = png.toString('latin1', pos + 4, pos + 8);
    if (type === 'IEND') {
      hasEnd = true;
      break;
    }
    if (type === 'IDAT') {
      imageData.push(png.subarray(pos + 8, pos + 8 + length));
    }
    pos += length + 12;
  }
  if (!hasEnd) {
    return false;
  }

  const rowLength = width * bytesPerPixel + 1;
  const expectedLength = rowLength * height;
  let pixels: Buffer;
  try {
    pixels = zlib.inflateSync(Buffer.concat(imageData), {
      maxOutputLength: expectedLength,
    });
  } catch {
    return false;
  }
  if (pixels.length !== expectedLength) {
    return false;
  }
  for (let row = 0; row < height; row++) {
    if (pixels[row * rowLength] > MAX_PNG_FILTER_TYPE) {
      return false;
    }
  }
  return true;
}

/**
 * Check that a report visualization image is a base64-encoded PNG data URI, the
 * format the reporting client produces with dom-to-image, with a supported
 * format and size. Only the header is read: use validateVisualizationImages to
 * check that the images can be decoded.
 * Returns the validation error message, if any.
 */
export function validateVisualizationImage(value: unknown): string | undefined {
  const header = readImageHeader(value);
  return typeof header === 'string' ? header : undefined;
}

/**
 * Check that the report visualization images can be safely decoded by the PDF
 * library. The cheap checks (count, headers and total size) run on every image
 * before decoding any of them.
 * Returns the validation error message, if any.
 */
export function validateVisualizationImages(
  values: unknown[],
): string | undefined {
  if (values.length > MAX_VISUALIZATION_IMAGES) {
    return `must contain at most ${MAX_VISUALIZATION_IMAGES} images`;
  }
  let totalPixels = 0;
  for (let index = 0; index < values.length; index++) {
    const header = readImageHeader(values[index]);
    if (typeof header === 'string') {
      return `image ${index} ${header}`;
    }
    totalPixels += header.width * header.height;
  }
  if (totalPixels > MAX_VISUALIZATION_IMAGES_TOTAL_PIXELS) {
    return `images must have at most ${MAX_VISUALIZATION_IMAGES_TOTAL_PIXELS} pixels in total`;
  }
  for (let index = 0; index < values.length; index++) {
    const png = Buffer.from(
      (values[index] as string).slice(PNG_DATA_URI_PREFIX.length),
      'base64',
    );
    if (!isDecodablePNG(png)) {
      return `image ${index} must contain valid PNG image data`;
    }
  }
  return undefined;
}
