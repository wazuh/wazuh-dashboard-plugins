export const ValidateServerAddress = value => {
  const isFQDN =
    /^(?!(?:[0-9-]{0,62}[0-9]|[0-9-]{0,62})\.)([a-zA-Z0-9áéíóúüñ](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9áéíóúüñ])?\.){2,}(?:[a-zA-Záéíóúüñ]{2,63}|[a-zA-Z0-9-áéíóúüñ]{2,63}\.[a-zA-Záéíóúüñ]{2,63})$/;

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

export const ValidateAgentName = value => {
  if (value.length === 0) {
    return undefined;
  }
  const regex = /^[A-Za-z.\-_,]+$/;

  const isLengthValid = value.length >= 2 && value.length <= 63;
  const isFormatValid = regex.test(value);
  if (!isFormatValid && !isLengthValid) {
    return 'The minimum length is 2 characters. The character is not valid. Allowed characters are A-Z, a-z, ".", "-", "_"';
  } else if (!isLengthValid) {
    return 'The minimum length is 2 characters.';
  } else if (!isFormatValid) {
    return 'The character is not valid. Allowed characters are A-Z, a-z, ".", "-", "_"';
  }
  return '';
};
