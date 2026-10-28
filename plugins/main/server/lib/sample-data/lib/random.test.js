const random = require('./random');

describe('dateNanos', () => {
  it('returns an ISO date with nine fractional digits', () => {
    expect(random.dateNanos(1)).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}Z$/,
    );
  });

  it('stays within the requested days', () => {
    const value = Date.parse(random.dateNanos(1));
    expect(value).toBeLessThanOrEqual(Date.now());
    expect(value).toBeGreaterThanOrEqual(Date.now() - 24 * 60 * 60 * 1000);
  });
});
