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

/* A stored token is typed or pasted in by hand, and it reaches the generated
command wrapped in single quotes (WAZUH_ENROLLMENT_TOKEN='value'), so a quote or
a space in it would break the command apart. Only that is checked: whether the
text is a token the manager issued, and whether it is still valid, is decided by
the manager at enrollment time, and a second rule computed here would drift from
the one it actually enforces. */
export const validateExistingEnrollmentToken = (value: string) => {
  if (!value || value.trim().length === 0) {
    return undefined;
  }
  const token = value.trim();
  if (/\s/.test(token)) {
    return 'The token must not contain spaces or line breaks.';
  }
  if (token.includes("'")) {
    return 'The character "\'" is not valid in an enrollment token.';
  }
  return undefined;
};
