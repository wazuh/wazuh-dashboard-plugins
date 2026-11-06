import zlib from 'zlib';
import {
  MAX_VISUALIZATION_IMAGE_HEIGHT,
  MAX_VISUALIZATION_IMAGE_WIDTH,
  MAX_VISUALIZATION_IMAGES,
  MAX_VISUALIZATION_IMAGES_TOTAL_PIXELS,
  parseVisualizationImages,
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
}

const createHeader = ({ width = 2, height = 2, colorType = 6 }: PNGOptions) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = colorType;
  return header;
};

// Deflated RGBA rows
const createImageData = ({ width = 2, height = 2, filter = 0 }: PNGOptions) => {
  const row = Buffer.alloc(width * 4 + 1);
  row[0] = filter;
  return zlib.deflateSync(Buffer.concat(Array(height).fill(row)));
};

const createDataURI = (...chunks: Buffer[]) =>
  `data:image/png;base64,${Buffer.concat([PNG_SIGNATURE, ...chunks]).toString(
    'base64',
  )}`;

const HEADER_CHUNK = createChunk('IHDR', createHeader({}));
const IMAGE_DATA = createImageData({});
const END_CHUNK = createChunk('IEND', Buffer.alloc(0));

// Build an 8-bit PNG data URI. The image data defaults to deflated RGBA rows.
const createPNG = (options: PNGOptions = {}) =>
  createDataURI(
    createChunk('IHDR', createHeader(options)),
    createChunk('IDAT', options.imageData ?? createImageData(options)),
    END_CHUNK,
  );

const readChunks = (dataURI: string) => {
  const png = Buffer.from(dataURI.split(',')[1], 'base64');
  const chunks: { type: string; data: Buffer; crc: number }[] = [];
  for (let pos = 8; pos < png.length; ) {
    const length = png.readUInt32BE(pos);
    chunks.push({
      type: png.toString('latin1', pos + 4, pos + 8),
      data: png.subarray(pos + 8, pos + 8 + length),
      crc: png.readUInt32BE(pos + 8 + length),
    });
    pos += length + 12;
  }
  return chunks;
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
      createPNG({
        width: MAX_VISUALIZATION_IMAGE_WIDTH + 1,
        imageData: noImageData,
      }),
      SIZE_MESSAGE,
    ],
    [
      'height over the limit',
      createPNG({
        height: MAX_VISUALIZATION_IMAGE_HEIGHT + 1,
        imageData: noImageData,
      }),
      SIZE_MESSAGE,
    ],
    [
      'palette color type',
      createPNG({ colorType: 3 }),
      'must be an 8-bit, non-interlaced and non-palette PNG',
    ],
    [
      'header chunk longer than 13 bytes',
      createDataURI(
        createChunk('IHDR', Buffer.concat([createHeader({}), END_CHUNK])),
        createChunk('IDAT', IMAGE_DATA),
        END_CHUNK,
      ),
      'must be a base64-encoded PNG data URI',
    ],
    [
      'corrupt image data',
      createPNG({ imageData: Buffer.from('not zlib data') }),
      DATA_MESSAGE,
    ],
    ['invalid row filter', createPNG({ filter: 9 }), DATA_MESSAGE],
    [
      'truncated image data',
      createPNG({ imageData: zlib.deflateSync(Buffer.alloc(17)) }),
      DATA_MESSAGE,
    ],
    [
      'image data split around the end chunk',
      createDataURI(
        HEADER_CHUNK,
        createChunk('IDAT', IMAGE_DATA.subarray(0, 4)),
        END_CHUNK,
        createChunk('IDAT', IMAGE_DATA.subarray(4)),
      ),
      DATA_MESSAGE,
    ],
    [
      'second header chunk',
      createDataURI(
        HEADER_CHUNK,
        createChunk('IDAT', IMAGE_DATA),
        createChunk('IHDR', createHeader({ width: 8192, height: 4096 })),
        END_CHUNK,
      ),
      DATA_MESSAGE,
    ],
    [
      'transparency chunk',
      createDataURI(
        HEADER_CHUNK,
        createChunk('tRNS', END_CHUNK),
        createChunk('IDAT', IMAGE_DATA),
        END_CHUNK,
      ),
      DATA_MESSAGE,
    ],
    [
      'end chunk running past the data',
      createDataURI(
        HEADER_CHUNK,
        createChunk('IDAT', IMAGE_DATA),
        END_CHUNK.subarray(0, 8),
      ),
      DATA_MESSAGE,
    ],
  ])('rejects an image with %s', (_title, image, message) => {
    expect(validateVisualizationImages([PNG_DATA_URI, image])).toBe(
      `image 1 ${message}`,
    );
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
      imageData: noImageData,
    });
    expect(MAX_VISUALIZATION_IMAGES_TOTAL_PIXELS).toBe(32 * 1024 * 1024);
    expect(validateVisualizationImages([image, image])).toBe(
      'images must have at most 33554432 pixels in total',
    );
  });
});

describe('parseVisualizationImages', () => {
  it('rebuilds the images with only the header, image data and end chunks', () => {
    const image = createDataURI(
      HEADER_CHUNK,
      createChunk('tEXt', Buffer.from('Software\0test', 'latin1')),
      createChunk('IDAT', IMAGE_DATA.subarray(0, 5)),
      createChunk('IDAT', IMAGE_DATA.subarray(5)),
      END_CHUNK,
    );

    const { images } = parseVisualizationImages([image]) as {
      images: string[];
    };

    const chunks = readChunks(images[0]);
    expect(chunks.map(({ type }) => type)).toEqual(['IHDR', 'IDAT', 'IEND']);
    expect(chunks[0].data.readUInt32BE(0)).toBe(2);
    expect(chunks[0].data.readUInt32BE(4)).toBe(2);
    expect(chunks[1].data).toEqual(IMAGE_DATA);
    // The chunks carry real CRCs: the one of the end chunk is a constant
    expect(chunks[2].crc).toBe(0xae426082);
  });
});
