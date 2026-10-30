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
const MAX_PNG_CHUNK_LENGTH = 0x7fffffff;
// Chunks the PDF library reads with a layout of its own. The header chunk is
// only valid first, and the client never produces the palette or transparency.
const REJECTED_PNG_CHUNK_TYPES = ['IHDR', 'PLTE', 'tRNS'];

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
    png.readUInt32BE(8) !== 13 ||
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

// CRC-32 lookup table of the PNG chunks
const CRC_TABLE = new Uint32Array(256).map((_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit++) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc;
});

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index++) {
    crc = CRC_TABLE[(crc ^ data[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPNGChunk(type: string, data: Buffer): Buffer {
  const chunk = Buffer.alloc(data.length + 12);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 'latin1');
  data.copy(chunk, 8);
  chunk.writeUInt32BE(
    crc32(chunk.subarray(4, data.length + 8)),
    data.length + 8,
  );
  return chunk;
}

/**
 * Decode the PNG as the PDF library does and rebuild it from the validated
 * parts only: the header, the image data and the end chunk. The image data must
 * inflate to exactly the expected size with valid row filters, so the PDF
 * library cannot throw outside of the report generation promise.
 * Returns the rebuilt PNG or undefined if the image is not valid.
 */
function rebuildPNG(png: Buffer): Buffer | undefined {
  const header = readPNGHeader(png);
  if (typeof header === 'string') {
    return undefined;
  }
  const { width, height, bytesPerPixel } = header;

  // Walk the chunks strictly so that the PDF library cannot read them in
  // another way: every chunk fits in the data and the walk stops at the
  // required end chunk, as the PDF library does
  const imageData: Buffer[] = [];
  for (let pos = PNG_HEADER_LENGTH, hasEnd = false; !hasEnd; ) {
    if (pos + 12 > png.length) {
      return undefined;
    }
    const length = png.readUInt32BE(pos);
    if (length > MAX_PNG_CHUNK_LENGTH || pos + length + 12 > png.length) {
      return undefined;
    }
    const type = png.toString('latin1', pos + 4, pos + 8);
    if (REJECTED_PNG_CHUNK_TYPES.includes(type)) {
      return undefined;
    }
    if (type === 'IDAT') {
      imageData.push(png.subarray(pos + 8, pos + 8 + length));
    }
    hasEnd = type === 'IEND';
    pos += length + 12;
  }

  const data = Buffer.concat(imageData);
  const rowLength = width * bytesPerPixel + 1;
  const expectedLength = rowLength * height;
  let pixels: Buffer;
  try {
    pixels = zlib.inflateSync(data, { maxOutputLength: expectedLength });
  } catch {
    return undefined;
  }
  if (pixels.length !== expectedLength) {
    return undefined;
  }
  for (let row = 0; row < height; row++) {
    if (pixels[row * rowLength] > MAX_PNG_FILTER_TYPE) {
      return undefined;
    }
  }
  return Buffer.concat([
    PNG_SIGNATURE,
    createPNGChunk('IHDR', png.subarray(16, 29)),
    createPNGChunk('IDAT', data),
    createPNGChunk('IEND', Buffer.alloc(0)),
  ]);
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

export type VisualizationImagesParseResult =
  | { error: string }
  | { images: string[] };

/**
 * Check that the report visualization images can be safely decoded by the PDF
 * library and rebuild them from the validated parts, so the PDF library only
 * reads data built here. The cheap checks (count, headers and total size) run
 * on every image before decoding any of them.
 * Returns the validation error message or the rebuilt PNG data URIs.
 */
export function parseVisualizationImages(
  values: unknown[],
): VisualizationImagesParseResult {
  if (values.length > MAX_VISUALIZATION_IMAGES) {
    return { error: `must contain at most ${MAX_VISUALIZATION_IMAGES} images` };
  }
  let totalPixels = 0;
  for (let index = 0; index < values.length; index++) {
    const header = readImageHeader(values[index]);
    if (typeof header === 'string') {
      return { error: `image ${index} ${header}` };
    }
    totalPixels += header.width * header.height;
  }
  if (totalPixels > MAX_VISUALIZATION_IMAGES_TOTAL_PIXELS) {
    return {
      error: `images must have at most ${MAX_VISUALIZATION_IMAGES_TOTAL_PIXELS} pixels in total`,
    };
  }
  const images: string[] = [];
  for (let index = 0; index < values.length; index++) {
    const png = rebuildPNG(
      Buffer.from(
        (values[index] as string).slice(PNG_DATA_URI_PREFIX.length),
        'base64',
      ),
    );
    if (!png) {
      return { error: `image ${index} must contain valid PNG image data` };
    }
    images.push(`${PNG_DATA_URI_PREFIX}${png.toString('base64')}`);
  }
  return { images };
}

/**
 * Check that the report visualization images can be safely decoded by the PDF
 * library. See parseVisualizationImages.
 * Returns the validation error message, if any.
 */
export function validateVisualizationImages(
  values: unknown[],
): string | undefined {
  const result = parseVisualizationImages(values);
  return 'error' in result ? result.error : undefined;
}
