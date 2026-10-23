import { ReportPrinter } from './printer';

// 1x1 transparent PNG
const PNG_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0' +
  'lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

type PrinterParameters = ConstructorParameters<typeof ReportPrinter>;
type Visualizations = Parameters<ReportPrinter['addVisualizations']>[0];
interface ContentNode {
  columns?: { image?: string }[];
}

const createPrinter = () =>
  new ReportPrinter(
    {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as PrinterParameters[0],
    {} as PrinterParameters[1],
  );

const getContent = (printer: ReportPrinter): ContentNode[] =>
  (printer as unknown as { _content: ContentNode[] })._content;

describe('ReportPrinter.addVisualizations', () => {
  it('adds PNG data URI visualizations as images', () => {
    const printer = createPrinter();

    printer.addVisualizations([
      { title: 'Full', element: PNG_DATA_URI, width: 800, height: 100 },
      { title: 'Split', element: PNG_DATA_URI, width: 300, height: 100 },
    ]);

    const images = getContent(printer)
      .flatMap(({ columns }) => columns || [])
      .filter(({ image }) => image);
    expect(images).toHaveLength(2);
    images.forEach(({ image }) => expect(image).toBe(PNG_DATA_URI));
  });

  it.each`
    title                   | element
    ${'file name'}          | ${'chart.png'}
    ${'plain text'}         | ${'not-an-image'}
    ${'remote URL'}         | ${'https://example.com/a.png'}
    ${'malformed data URI'} | ${'data:image/png;base64,@@@'}
    ${'SVG data URI'}       | ${'data:image/svg+xml;base64,PHN2Zz4='}
    ${'missing element'}    | ${undefined}
    ${'non-string element'} | ${{ src: 'chart.png' }}
  `(
    'throws before adding any content when an element is a $title',
    ({ element }) => {
      const printer = createPrinter();
      const visualizations = [
        { title: 'Valid', element: PNG_DATA_URI, width: 800, height: 100 },
        { title: 'Invalid', element, width: 300, height: 100 },
      ];

      let thrown: Error | undefined;
      try {
        printer.addVisualizations(visualizations as Visualizations);
      } catch (error) {
        thrown = error as Error;
      }

      expect(thrown).toBeInstanceOf(Error);
      expect(thrown?.message).toMatch(/base64-encoded PNG data URI/);
      if (typeof element === 'string') {
        expect(thrown?.message).not.toContain(element);
      }
      expect(getContent(printer)).toHaveLength(0);
    },
  );
});
