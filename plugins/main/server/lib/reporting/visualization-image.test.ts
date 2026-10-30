import zlib from 'zlib';
import {
  MAX_VISUALIZATION_IMAGE_HEIGHT,
  MAX_VISUALIZATION_IMAGE_WIDTH,
  MAX_VISUALIZATION_IMAGES,
  MAX_VISUALIZATION_IMAGES_TOTAL_PIXELS,
  validateVisualizationImage,
  validateVisualizationImages,
} from './visualization-image';

// 1x1 transparent PNG
const PNG_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0' +
  'lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

// Chunk CRCs are left as zeros: neither the validation nor the PDF library verifies them
const createChunk = (type: string, data: Buffer) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  return Buffer.concat([
    length,
    Buffer.from(type, 'latin1'),
    data,
    Buffer.alloc(4),
  ]);
};

interface PNGOptions {
  width?: number;
  height?: number;
  colorType?: number;
  filter?: number;
  imageData?: Buffer;
  imageDataAfterEnd?: Buffer;
}

// Build an 8-bit PNG data URI. The image data defaults to deflated RGBA rows.
const createPNG = ({
  width = 2,
  height = 2,
  colorType = 6,
  filter = 0,
  imageData,
  imageDataAfterEnd,
}: PNGOptions = {}) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = colorType;
  const row = Buffer.alloc(width * 4 + 1);
  row[0] = filter;
  const png = Buffer.concat([
    PNG_SIGNATURE,
    createChunk('IHDR', header),
    createChunk(
      'IDAT',
      imageData ?? zlib.deflateSync(Buffer.concat(Array(height).fill(row))),
    ),
    createChunk('IEND', Buffer.alloc(0)),
    ...(imageDataAfterEnd ? [createChunk('IDAT', imageDataAfterEnd)] : []),
  ]);
  return `data:image/png;base64,${png.toString('base64')}`;
};

describe('validateVisualizationImage', () => {
  it.each`
    title                       | value
    ${'file name'}              | ${'chart.png'}
    ${'plain text'}             | ${'not-an-image'}
    ${'relative path'}          | ${'images/chart.png'}
    ${'remote URL'}             | ${'https://example.com/a.png'}
    ${'empty payload'}          | ${'data:image/png;base64,'}
    ${'malformed payload'}      | ${'data:image/png;base64,@@@'}
    ${'non-PNG payload'}        | ${'data:image/png;base64,aGk='}
    ${'trailing content'}       | ${'data:image/png;base64,aGk=\nextra'}
    ${'SVG data URI'}           | ${'data:image/svg+xml;base64,PHN2Zz4='}
    ${'text data URI'}          | ${'data:text/plain;base64,aGk='}
    ${'non-base64 PNG data'}    | ${'data:image/png,aGk='}
    ${'empty string'}           | ${''}
    ${'undefined'}              | ${undefined}
    ${'null'}                   | ${null}
    ${'number'}                 | ${1}
    ${'object'}                 | ${{ element: PNG_DATA_URI }}
    ${'array'}                  | ${[PNG_DATA_URI]}
    ${'data URI with prefix'}   | ${` ${PNG_DATA_URI}`}
    ${'data URI with trailing'} | ${`${PNG_DATA_URI} `}
  `('rejects $title', ({ value }) => {
    expect(validateVisualizationImage(value)).toBe(
      'must be a base64-encoded PNG data URI',
    );
  });
});

describe('validateVisualizationImages', () => {
  it.each`
    title                  | value
    ${'RGBA PNG'}          | ${createPNG()}
    ${'1x1 grayscale PNG'} | ${PNG_DATA_URI}
  `('accepts a decodable $title', ({ value }) => {
    expect(validateVisualizationImages([value])).toBeUndefined();
  });

  const SIZE_MESSAGE = 'must be at most 8192x4096 pixels';
  const DATA_MESSAGE = 'must contain valid PNG image data';
  // Headers only: the size is rejected before reading the image data
  const noImageData = Buffer.alloc(0);

  it.each([
    [
      'width over the limit',
      { width: MAX_VISUALIZATION_IMAGE_WIDTH + 1, imageData: noImageData },
      SIZE_MESSAGE,
    ],
    [
      'height over the limit',
      { height: MAX_VISUALIZATION_IMAGE_HEIGHT + 1, imageData: noImageData },
      SIZE_MESSAGE,
    ],
    [
      'palette color type',
      { colorType: 3 },
      'must be an 8-bit, non-interlaced and non-palette PNG',
    ],
    [
      'corrupt image data',
      { imageData: Buffer.from('not zlib data') },
      DATA_MESSAGE,
    ],
    ['invalid row filter', { filter: 9 }, DATA_MESSAGE],
    [
      'truncated image data',
      { imageData: zlib.deflateSync(Buffer.alloc(17)) },
      DATA_MESSAGE,
    ],
    [
      'image data split around the end chunk',
      {
        imageData: zlib.deflateSync(Buffer.alloc(18)).subarray(0, 4),
        imageDataAfterEnd: zlib.deflateSync(Buffer.alloc(18)).subarray(4),
      },
      DATA_MESSAGE,
    ],
  ])('rejects an image with %s', (_title, options, message) => {
    expect(
      validateVisualizationImages([PNG_DATA_URI, createPNG(options)]),
    ).toBe(`image 1 ${message}`);
  });

  it('rejects too many images', () => {
    expect(
      validateVisualizationImages(
        Array(MAX_VISUALIZATION_IMAGES + 1).fill(PNG_DATA_URI),
      ),
    ).toBe('must contain at most 100 images');
  });

  it('rejects images over the total pixel budget before decoding them', () => {
    // Headers only: decoding any of these images would fail with another message
    const image = createPNG({
      width: MAX_VISUALIZATION_IMAGE_WIDTH,
      height: MAX_VISUALIZATION_IMAGE_HEIGHT,
      imageData: Buffer.alloc(0),
    });
    expect(MAX_VISUALIZATION_IMAGES_TOTAL_PIXELS).toBe(32 * 1024 * 1024);
    expect(validateVisualizationImages([image, image])).toBe(
      'images must have at most 33554432 pixels in total',
    );
  });
});
