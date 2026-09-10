import {
  validateEnrollmentTokenMaxUses,
  validateEnrollmentTokenTtl,
} from './validations';

describe('validateEnrollmentTokenTtl', () => {
  it.each(['', '   ', '30d', '12h', '45m', '90s', '3600'])(
    'accepts %p',
    value => {
      expect(validateEnrollmentTokenTtl(value)).toBeUndefined();
    },
  );

  it.each(['30 d', '12hours', 'd', '-1h', '1.5h'])('rejects %p', value => {
    expect(validateEnrollmentTokenTtl(value)).toEqual(
      'The lifetime must be a number of seconds, or a number followed by "d", "h", "m" or "s". For example: 30d, 12h, 3600.',
    );
  });

  it('rejects a lifetime of zero', () => {
    expect(validateEnrollmentTokenTtl('0d')).toEqual(
      'The lifetime must be greater than 0.',
    );
  });
});

describe('validateEnrollmentTokenMaxUses', () => {
  it.each(['', '0', '1', '500'])('accepts %p', value => {
    expect(validateEnrollmentTokenMaxUses(value)).toBeUndefined();
  });

  it.each(['-1', '1.5', 'many'])('rejects %p', value => {
    expect(validateEnrollmentTokenMaxUses(value)).toEqual(
      'The number of enrollments must be a whole number of 0 or more, where 0 means unlimited.',
    );
  });
});
