import { isVisualizationImageDataURI } from './visualization-image';

// 1x1 transparent PNG
const PNG_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0' +
  'lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('isVisualizationImageDataURI', () => {
  it('accepts a base64-encoded PNG data URI', () => {
    expect(isVisualizationImageDataURI(PNG_DATA_URI)).toBe(true);
  });

  it.each`
    title                       | value
    ${'file name'}              | ${'chart.png'}
    ${'plain text'}             | ${'not-an-image'}
    ${'relative path'}          | ${'images/chart.png'}
    ${'remote URL'}             | ${'https://example.com/a.png'}
    ${'empty payload'}          | ${'data:image/png;base64,'}
    ${'malformed payload'}      | ${'data:image/png;base64,@@@'}
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
    expect(isVisualizationImageDataURI(value)).toBe(false);
  });
});
