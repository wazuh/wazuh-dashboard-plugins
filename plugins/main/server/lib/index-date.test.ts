import { indexDate } from './index-date';

describe('indexDate', () => {
  const RealDate = Date;

  const mockDate = (isoDate: string) => {
    const fixedDate = new RealDate(isoDate);

    class MockDate extends RealDate {
      constructor(...args: ConstructorParameters<typeof RealDate>) {
        if (args.length === 0) {
          super(fixedDate.toISOString());
          return;
        }
        super(...args);
      }

      static now() {
        return fixedDate.getTime();
      }
    }

    globalThis.Date = MockDate as DateConstructor;
  };

  afterEach(() => {
    globalThis.Date = RealDate;
  });

  describe('hourly indices', () => {
    it.each([
      ['2026-01-16T14:30:45Z', '2026.01.16.14h'],
      ['2026-12-31T23:59:59Z', '2026.12.31.23h'],
      ['2026-01-01T00:00:00Z', '2026.01.01.00h'],
    ])('generates hourly format for %s', (isoDate, expected) => {
      mockDate(isoDate);
      expect(indexDate('h')).toBe(expected);
    });
  });

  describe('daily indices', () => {
    it.each([
      ['2026-01-16T14:30:45Z', '2026.01.16'],
      ['2026-12-31T23:59:59Z', '2026.12.31'],
      ['2026-01-01T00:00:00Z', '2026.01.01'],
    ])('generates daily format for %s', (isoDate, expected) => {
      mockDate(isoDate);
      expect(indexDate('d')).toBe(expected);
    });
  });

  describe('weekly indices', () => {
    it.each([
      ['2025-12-29T12:00:00Z', '2026.1w'],
      ['2025-12-30T12:00:00Z', '2026.1w'],
      ['2025-12-31T12:00:00Z', '2026.1w'],
    ])('uses the ISO week-year for %s', (isoDate, expected) => {
      mockDate(isoDate);
      expect(indexDate('w')).toBe(expected);
    });

    it.each([
      ['2026-12-28T12:00:00Z', '2026.53w'],
      ['2026-12-29T12:00:00Z', '2026.53w'],
      ['2026-12-30T12:00:00Z', '2026.53w'],
      ['2026-12-31T12:00:00Z', '2026.53w'],
      ['2027-01-01T12:00:00Z', '2026.53w'],
      ['2027-01-02T12:00:00Z', '2026.53w'],
      ['2027-01-03T12:00:00Z', '2026.53w'],
    ])(
      'uses the ISO week-year for dates around the 2026/2027 boundary',
      (isoDate, expected) => {
        mockDate(isoDate);
        expect(indexDate('w')).toBe(expected);
      },
    );
  });

  describe('monthly indices', () => {
    it.each([
      ['2026-01-16T14:30:45Z', '2026.01'],
      ['2026-12-31T23:59:59Z', '2026.12'],
      ['2026-01-01T00:00:00Z', '2026.01'],
    ])('generates monthly format for %s', (isoDate, expected) => {
      mockDate(isoDate);
      expect(indexDate('m')).toBe(expected);
    });
  });
});
