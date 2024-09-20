const { FREQUENCY } = require('./regulatory-compliance');

describe('regulatory-compliance', () => {
  it('should_verify_all_values_in_frequency_are_integers', () => {
    expect(FREQUENCY.every(value => Number.isInteger(value))).toBe(true);
  });
});
