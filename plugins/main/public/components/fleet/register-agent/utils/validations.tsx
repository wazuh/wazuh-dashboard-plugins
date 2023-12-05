//IP: This is a set of four numbers, for example, 192.158.1.38. Each number in the set can range from 0 to 255. Therefore, the full range of IP addresses goes from 0.0.0.0 to 255.255.255.255
// O ipv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334

// FQDN: Maximum of 63 characters per label.
// Can only contain numbers, letters and hyphens (-)
// Labels cannot begin or end with a hyphen
// Currently supports multilingual characters, i.e. letters not included in the English alphabet: e.g. á é í ó ú ü ñ.
// Minimum 3 labels
export const validateServerAddress = (value: any) => {
  const isFQDN =
    /^(?!-)(?!.*--)(?!.*\d$)[a-zA-Z0-9áéíóúüñ]{1,63}(?:-[a-zA-Z0-9áéíóúüñ]{1,63})*(?:\.[a-zA-Z0-9áéíóúüñ]{1,63}(?:-[a-zA-Z0-9áéíóúüñ]{1,63})*){1,}$/;
  const isIP =
    /^(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3}|(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4})$/;
  const numbersAndPoints = /^[0-9.]+$/;
  const areLettersNumbersAndColons = /^[a-zA-Z0-9:]+$/;
  const letters = /[a-zA-Z]/;
  const isFQDNFormatValid = isFQDN.test(value);
  const isIPFormatValid = isIP.test(value);
  const areNumbersAndPoints = numbersAndPoints.test(value);
  const hasLetters = letters.test(value);
  const hasPoints = value.includes('.');

  let validation = undefined;
  if (value.length === 0) {
    return validation;
  } else if (isFQDNFormatValid && value !== '') {
    return validation; // FQDN valid
  } else if (isIPFormatValid && value !== '') {
    return validation; // IP valid
  } else if (hasPoints && hasLetters && !isFQDNFormatValid) {
    return (validation =
      'Each label must have a letter or number at the beginning. The maximum length is 63 characters.'); // FQDN invalid
  } else if (
    (areNumbersAndPoints || areLettersNumbersAndColons) &&
    !isIPFormatValid
  ) {
    return (validation = 'Not a valid IP'); // IP invalid
  }
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
