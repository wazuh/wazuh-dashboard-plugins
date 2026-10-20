import {
  validateEnrollmentTokenDescription,
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

describe('validateEnrollmentTokenTtl maximum', () => {
  it.each(['3650d', '87600h', '5256000m', '315360000', '1d'])(
    'accepts %p',
    value => {
      expect(validateEnrollmentTokenTtl(value)).toBeUndefined();
    },
  );

  it.each(['3651d', '36500d', '999999999d', '87601h', '315360001'])(
    'rejects %p over 3650 days',
    value => {
      expect(validateEnrollmentTokenTtl(value)).toEqual(
        'The lifetime can be at most 3650 days (10 years). For example: 3650d.',
      );
    },
  );
});

describe('validateEnrollmentTokenDescription', () => {
  it.each([
    '',
    '   ',
    'Office laptops',
    'Oficina Málaga',
    "Bob's laptops",
    'Lab (EU), batch #2',
    'Team: SOC/IR',
    'a"b',
    'a<b',
    '日本',
    'x'.repeat(256),
  ])('accepts %p', value => {
    expect(validateEnrollmentTokenDescription(value)).toBeUndefined();
  });

  it('names the ampersand', () => {
    expect(validateEnrollmentTokenDescription('Servers & routers')).toContain(
      'cannot contain: &.',
    );
  });

  it('lists each refused character once', () => {
    expect(validateEnrollmentTokenDescription('a@b@c$d;')).toContain(
      'cannot contain: @ $ ;.',
    );
  });

  it('rejects a description over 256 characters', () => {
    expect(validateEnrollmentTokenDescription('x'.repeat(257))).toEqual(
      'The description can have at most 256 characters.',
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
