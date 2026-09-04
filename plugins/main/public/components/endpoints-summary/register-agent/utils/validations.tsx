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
