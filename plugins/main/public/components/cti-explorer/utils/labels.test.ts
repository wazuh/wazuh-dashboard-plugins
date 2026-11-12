import { formatDate, formatUtcTimestamp } from './labels';

/** The day as the browser's locale writes it, in UTC. */
const localeDay = (utc: number) =>
  new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(utc);

describe('formatDate', () => {
  it("shows only the day, in the browser's locale", () => {
    expect(formatDate('2024-07-01T13:05:09.000Z')).toBe(
      localeDay(Date.UTC(2024, 6, 1)),
    );
  });

  it('keeps the day of the record, in UTC, late in the day', () => {
    // 22:17 UTC is the next day east of UTC: the record still says the 19th.
    expect(formatDate('2026-08-19T22:17:14Z')).toBe(
      localeDay(Date.UTC(2026, 7, 19)),
    );
  });

  it('reads a date without an offset as UTC', () => {
    expect(formatDate('2026-08-19T23:59:59')).toBe(
      localeDay(Date.UTC(2026, 7, 19)),
    );
  });

  it('shows a dash for a missing or invalid date', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('')).toBe('-');
    expect(formatDate('not a date')).toBe('-');
  });
});

describe('formatUtcTimestamp', () => {
  it('writes the full date in UTC, the same in every locale', () => {
    expect(formatUtcTimestamp('2026-08-19T22:17:14.000Z')).toBe(
      '2026-08-19 22:17:14 UTC',
    );
    expect(formatUtcTimestamp('2026-08-20T00:17:14+02:00')).toBe(
      '2026-08-19 22:17:14 UTC',
    );
  });

  it('has no timestamp for a missing or invalid date', () => {
    expect(formatUtcTimestamp(null)).toBeNull();
    expect(formatUtcTimestamp('not a date')).toBeNull();
  });
});
