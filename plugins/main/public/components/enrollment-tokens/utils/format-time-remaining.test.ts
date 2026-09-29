import { formatTimeRemaining } from './format-time-remaining';

const NOW = Date.parse('2026-09-10T12:00:00+00:00');

describe('formatTimeRemaining', () => {
  it('reports the days left for a token that has not expired yet', () => {
    expect(formatTimeRemaining('2026-09-13T12:00:00+00:00', NOW)).toBe(
      '3 days left',
    );
  });

  it('reports how long ago a token expired', () => {
    expect(formatTimeRemaining('2026-09-06T12:00:00+00:00', NOW)).toBe(
      'Expired 4 days ago',
    );
  });

  it('uses the singular form for exactly one unit', () => {
    expect(formatTimeRemaining('2026-09-11T12:00:00+00:00', NOW)).toBe(
      '1 day left',
    );
    expect(formatTimeRemaining('2026-09-09T12:00:00+00:00', NOW)).toBe(
      'Expired 1 day ago',
    );
  });

  it('falls back to the largest sub-day unit for a short-lived token', () => {
    expect(formatTimeRemaining('2026-09-10T15:00:00+00:00', NOW)).toBe(
      '3 hours left',
    );
    expect(formatTimeRemaining('2026-09-10T12:00:30+00:00', NOW)).toBe(
      '30 seconds left',
    );
  });

  it('returns a dash when there is nothing to compute from', () => {
    expect(formatTimeRemaining(undefined, NOW)).toBe('-');
    expect(formatTimeRemaining('not a date', NOW)).toBe('-');
  });
});
