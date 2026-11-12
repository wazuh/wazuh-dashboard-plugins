jest.mock('../plugin-services', () => ({
  getWazuhCore: jest.fn(),
}));

import moment from 'moment';
import { getWazuhCore } from '../plugin-services';
import {
  formatCtiTimestamp,
  getCtiTimestampFromNow,
  parseCtiTimestamp,
} from './cti-timestamp';

const TIMESTAMP = '2026-05-21T12:26:16.581939Z';
const mockFormatUIDate = jest.fn((date: string) => `formatted ${date}`);

describe('parseCtiTimestamp', () => {
  test('reads an ISO 8601 time with microseconds', () => {
    expect(parseCtiTimestamp(TIMESTAMP)?.toISOString()).toBe(
      '2026-05-21T12:26:16.581Z',
    );
  });

  test.each([undefined, '', 'yesterday', '21/05/2026'])(
    'is null for %p',
    value => {
      expect(parseCtiTimestamp(value)).toBeNull();
    },
  );
});

describe('formatCtiTimestamp', () => {
  beforeEach(() => {
    mockFormatUIDate.mockClear();
    (getWazuhCore as jest.Mock).mockReturnValue({
      utils: { formatUIDate: mockFormatUIDate },
    });
  });

  test('formats with the advanced settings date format', () => {
    expect(formatCtiTimestamp(TIMESTAMP)).toBe(`formatted ${TIMESTAMP}`);
    expect(mockFormatUIDate).toHaveBeenCalledWith(TIMESTAMP);
  });

  test('is a dash instead of an invalid date', () => {
    expect(formatCtiTimestamp('not a date')).toBe('-');
    expect(formatCtiTimestamp(undefined)).toBe('-');
    expect(mockFormatUIDate).not.toHaveBeenCalled();
  });
});

describe('getCtiTimestampFromNow', () => {
  const now = moment.utc('2026-05-21T12:30:00Z');

  test('says how long ago the time was', () => {
    expect(
      getCtiTimestampFromNow(moment.utc('2026-05-21T12:25:00Z'), now),
    ).toBe('5 minutes ago');
  });

  test('reads a time ahead of the browser clock as now', () => {
    expect(
      getCtiTimestampFromNow(moment.utc('2026-05-21T12:30:20Z'), now),
    ).toBe('a few seconds ago');
  });
});
