/* eslint-disable camelcase -- the Wazuh Server API listing is snake_case */
import { formatEnrollmentsUsage } from './format-enrollments-usage';

describe('formatEnrollmentsUsage', () => {
  it('shows the count against an unlimited allowance', () => {
    expect(formatEnrollmentsUsage({ uses: 900, max_uses: 0 })).toBe(
      '900 / Unlimited',
    );
    expect(
      formatEnrollmentsUsage({ uses: undefined, max_uses: undefined }),
    ).toBe('0 / Unlimited');
  });

  it('shows the count against the allowance when it is limited', () => {
    expect(formatEnrollmentsUsage({ uses: 3, max_uses: 50 })).toBe('3 / 50');
  });

  it('treats a missing use count as zero', () => {
    expect(formatEnrollmentsUsage({ uses: undefined, max_uses: 50 })).toBe(
      '0 / 50',
    );
  });
});
