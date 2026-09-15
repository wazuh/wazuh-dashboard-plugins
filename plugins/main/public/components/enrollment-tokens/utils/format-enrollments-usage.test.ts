/* eslint-disable camelcase -- the Wazuh Server API listing is snake_case */
import { formatEnrollmentsUsage } from './format-enrollments-usage';

describe('formatEnrollmentsUsage', () => {
  it('spells out an unlimited allowance', () => {
    expect(formatEnrollmentsUsage({ uses: 900, max_uses: 0 })).toBe(
      'Unlimited',
    );
    expect(
      formatEnrollmentsUsage({ uses: undefined, max_uses: undefined }),
    ).toBe('Unlimited');
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
