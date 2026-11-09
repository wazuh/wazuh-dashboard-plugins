import { formatDateTime } from './labels';

const mockSettings: Record<string, string> = {};

jest.mock('../../../kibana-services', () => ({
  getUiSettings: () => ({ get: (key: string) => mockSettings[key] }),
}));

describe('formatDateTime', () => {
  beforeEach(() => {
    mockSettings.dateFormat = 'YYYY-MM-DD HH:mm:ss';
    mockSettings['dateFormat:tz'] = 'UTC';
  });

  it('uses the date format and time zone of the advanced settings', () => {
    expect(formatDateTime('2024-07-01T13:05:09.000Z')).toBe(
      '2024-07-01 13:05:09',
    );

    mockSettings.dateFormat = 'MMM D, YYYY @ HH:mm';
    mockSettings['dateFormat:tz'] = 'America/New_York';
    expect(formatDateTime('2024-07-01T13:05:09.000Z')).toBe(
      'Jul 1, 2024 @ 09:05',
    );
  });

  it('reads a date without an offset as UTC', () => {
    expect(formatDateTime('2024-07-01T13:05:09')).toBe('2024-07-01 13:05:09');
  });

  it('shows a dash for a missing or invalid date', () => {
    expect(formatDateTime(null)).toBe('-');
    expect(formatDateTime('')).toBe('-');
    expect(formatDateTime('not a date')).toBe('-');
  });
});
