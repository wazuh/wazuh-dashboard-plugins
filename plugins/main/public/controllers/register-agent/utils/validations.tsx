//IPv4: This is a set of four numbers, for example, 192.158.1.38. Each number in the set can range from 0 to 255. Therefore, the full range of IP addresses goes from 0.0.0.0 to 255.255.255.255
//IPv6: This is a set or eight hexadecimal expressions, each from 0000 to FFFF. 2001:0db8:85a3:0000:0000:8a2e:0370:7334

// FQDN: Maximum of 63 characters per label.
// Can only contain numbers, letters and hyphens (-)
// Labels cannot begin or end with a hyphen
// Currently supports multilingual characters, i.e. letters not included in the English alphabet: e.g. á é í ó ú ü ñ.
// Minimum 3 labels
// A label can contain only numbers

// Hostname: Maximum of 63 characters per label. Same rules as FQDN apply.

export const validateServerAddress = (value: string) => {
  const isFQDNOrHostname =
    /^(?!-)(?!.*--)[a-zA-Z0-9áéíóúüñ-]{0,62}[a-zA-Z0-9áéíóúüñ](?:\.[a-zA-Z0-9áéíóúüñ-]{0,62}[a-zA-Z0-9áéíóúüñ]){0,}$/;
  const isIPv6 = /^(?:[0-9a-fA-F]{4}:){7}[0-9a-fA-F]{4}$/;

  if (
    value.length > 255 ||
    (value.length > 0 && !isFQDNOrHostname.test(value) && !isIPv6.test(value))
  ) {
    return 'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6';
  }
  return undefined;
};

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
