export const validateAgentName = (value: any) => {
  if (value.length === 0) {
    return undefined;
  }
  let invalidCharacters = validateCharacters(value);
  if (value.length < 2) {
    return `The minimum length is 2 characters.${
      invalidCharacters && ` ${invalidCharacters}`
    }`;
  }
  return `${invalidCharacters}`;
};

const validateCharacters = (value: any) => {
  const regex = /^[a-z0-9.\-_,]+$/i;
  const invalidCharacters = [
    ...new Set(value.split('').filter(char => !regex.test(char))),
  ];
  if (invalidCharacters.length > 1) {
    return `The characters "${invalidCharacters.join(
      ',',
    )}" are not valid. Allowed characters are A-Z, a-z, 0-9, ".", "-", "_"`;
  } else if (invalidCharacters.length === 1) {
    return `The character "${invalidCharacters[0]}" is not valid. Allowed characters are A-Z, a-z, 0-9, ".", "-", "_"`;
  }
  return '';
};

/* The CA path is interpolated into the generated command wrapped in single
quotes (PROP='value'), so a single quote in the value would break out of the
quoting. Everything else a filesystem path may contain -- spaces, backslashes,
drive letters, relative segments -- is left alone: the path is resolved on the
endpoint, not here, and Windows, Linux and macOS all spell it differently. */
export const validateManagerCaPath = (value: string) => {
  if (!value || value.trim().length === 0) {
    return undefined;
  }
  if (value.includes("'")) {
    return 'The character "\'" is not valid in a file path.';
  }
  return undefined;
};

/* The manager takes the token lifetime as a plain number of seconds, or as a
number followed by `d`, `h`, `m` or `s`. It is validated here because an
unparseable timeframe resolves to 0 on the manager side rather than being
refused. Left empty, the manager applies its own default of 30 days. */
export const validateEnrollmentTokenTtl = (value: string) => {
  if (!value || value.trim().length === 0) {
    return undefined;
  }
  const ttl = value.trim();
  if (!/^\d+[dhms]?$/.test(ttl)) {
    return 'The lifetime must be a number of seconds, or a number followed by "d", "h", "m" or "s". For example: 30d, 12h, 3600.';
  }
  if (Number.parseInt(ttl, 10) === 0) {
    return 'The lifetime must be greater than 0.';
  }
  return undefined;
};

/* Enrollments the token allows. 0 means unlimited, which is also what leaving
the field empty gets, since the manager defaults to it. */
export const validateEnrollmentTokenMaxUses = (value: string | number) => {
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }
  if (!/^\d+$/.test(String(value).trim())) {
    return 'The number of enrollments must be a whole number of 0 or more, where 0 means unlimited.';
  }
  return undefined;
};
