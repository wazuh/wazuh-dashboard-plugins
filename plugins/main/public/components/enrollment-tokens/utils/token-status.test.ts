/* eslint-disable camelcase -- the Wazuh Server API listing is snake_case */
import { getEnrollmentTokenStatus } from './token-status';

const NOW = Date.parse('2026-09-10T12:00:00+00:00');

describe('getEnrollmentTokenStatus', () => {
  it('reports a token that can still enroll as active', () => {
    expect(
      getEnrollmentTokenStatus(
        {
          expires: '2026-09-11T12:00:00+00:00',
          max_uses: 50,
          uses: 3,
        },
        NOW,
      ),
    ).toBe('active');
  });

  it('reports a revoked token as revoked, whatever else it says', () => {
    expect(
      getEnrollmentTokenStatus(
        {
          revoked: true,
          expires: '2026-09-11T12:00:00+00:00',
          max_uses: 50,
          uses: 0,
        },
        NOW,
      ),
    ).toBe('revoked');
  });

  it('reports a token past its expiry as expired', () => {
    expect(
      getEnrollmentTokenStatus({ expires: '2026-09-10T11:59:59+00:00' }, NOW),
    ).toBe('expired');
  });

  it('reports a token that consumed its allowance as exhausted', () => {
    expect(
      getEnrollmentTokenStatus(
        { expires: '2026-09-11T12:00:00+00:00', max_uses: 3, uses: 3 },
        NOW,
      ),
    ).toBe('exhausted');
  });

  it('never exhausts a token allowing unlimited enrollments', () => {
    expect(
      getEnrollmentTokenStatus(
        { expires: '2026-09-11T12:00:00+00:00', max_uses: 0, uses: 900 },
        NOW,
      ),
    ).toBe('active');
  });

  it('leaves a token whose expiry is missing or unreadable alone', () => {
    expect(getEnrollmentTokenStatus({}, NOW)).toBe('active');
    expect(getEnrollmentTokenStatus({ expires: 'never' }, NOW)).toBe('active');
  });
});
