import {
  validateAgentName,
  validateEnrollmentTokenMaxUses,
  validateEnrollmentTokenTtl,
  validateManagerCaPath,
} from './validations';

describe('Validations', () => {
  test('should return undefined for an empty value', () => {
    const emptyValue = '';
    const result = validateAgentName(emptyValue);
    expect(result).toBeUndefined();
  });

  test('should return an error message for invalid format and length', () => {
    const invalidAgentName = '?';
    const result = validateAgentName(invalidAgentName);
    expect(result).toBe(
      'The minimum length is 2 characters. The character "?" is not valid. Allowed characters are A-Z, a-z, 0-9, ".", "-", "_"',
    );
  });

  test('should return an error message for invalid format of 1 character', () => {
    const invalidAgentName = 'agent$name';
    const result = validateAgentName(invalidAgentName);
    expect(result).toBe(
      'The character "$" is not valid. Allowed characters are A-Z, a-z, 0-9, ".", "-", "_"',
    );
  });

  test('should return an error message for invalid format of more than 1 character', () => {
    const invalidAgentName = 'agent$?name';
    const result = validateAgentName(invalidAgentName);
    expect(result).toBe(
      'The characters "$,?" are not valid. Allowed characters are A-Z, a-z, 0-9, ".", "-", "_"',
    );
  });

  test('should return an error message for invalid length', () => {
    const invalidAgentName = 'a';
    const result = validateAgentName(invalidAgentName);
    expect(result).toBe('The minimum length is 2 characters.');
  });

  test('should return an empty string for a valid agent name', () => {
    const validAgentName = 'agent_name';
    const result = validateAgentName(validAgentName);
    expect(result).toBe('');
  });
});

describe('validateManagerCaPath', () => {
  test.each(['', '   ', undefined])(
    'should return undefined for the empty value %p',
    value => {
      expect(validateManagerCaPath(value)).toBeUndefined();
    },
  );

  test.each([
    '/var/ossec/etc/manager-ca.pem',
    'C:\\Program Files\\ossec-agent\\manager-ca.pem',
    './certs/manager ca.pem',
  ])('should accept the path %p', value => {
    expect(validateManagerCaPath(value)).toBeUndefined();
  });

  /* The path is interpolated into the command inside single quotes, so a single
  quote in the value would break out of them. */
  test('should return an error message for a path containing a single quote', () => {
    const result = validateManagerCaPath("/etc/ca's.pem");
    expect(result).toBe('The character "\'" is not valid in a file path.');
  });
});

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
