const validateCharacters = (value: any) => {
  const regex = /^[\w,.-]+$/i;
  const invalidCharacters = [
    ...new Set([...value].filter(char => !regex.test(char))),
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

export const validateAgentName = (value: any) => {
  if (value.length === 0) {
    return;
  }

  const invalidCharacters = validateCharacters(value);

  if (value.length < 2) {
    return `The minimum length is 2 characters.${
      invalidCharacters && ` ${invalidCharacters}`
    }`;
  }

  return `${invalidCharacters}`;
};

type TValidateOnDefinedCallback<T> = (
  value: T | undefined,
) => string | undefined;

function validateOnDefined<T>(callback: TValidateOnDefinedCallback<T>) {
  return (value: T) => (value ? callback(value) : undefined);
}

const serverAddressHostnameFQDNIPv4IPv6 = (value: string) => {
  const isFQDNOrHostname =
    /^(?!-)(?!.*--)[\dA-Za-záéíñóúü-]{0,62}[\dA-Za-záéíñóúü](?:\.[\dA-Za-záéíñóúü-]{0,62}[\dA-Za-záéíñóúü])*$/;
  const isIPv6 = /^(?:[\dA-Fa-f]{4}:){7}[\dA-Fa-f]{4}$/;

  if (
    value.length > 255 ||
    (value.length > 0 && !isFQDNOrHostname.test(value) && !isIPv6.test(value))
  ) {
    return 'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6.';
  }
};

const validateServerAddressPort = (value: number) =>
  value >= 0 && value <= 65535 ? undefined : 'The port has an invalid value.';

export const validateServerAddress = validateOnDefined((value: string) => {
  const URLRegex = /^https?:\/\/(.+):(\d+)$/;
  const matches = value.match(URLRegex);

  if (!matches) {
    return 'Value is not a valid URL.';
  }

  const [_, address, port] = matches;
  const addressValidation = serverAddressHostnameFQDNIPv4IPv6(address);
  const portValidation = validateServerAddressPort(Number(port));
  const validationError = [addressValidation, portValidation]
    .filter(Boolean)
    .join(' ');

  return validationError || undefined;
});

export const validateEnrollmentKey = validateOnDefined((value: string) =>
  /^[\da-z]{32}$/i.test(value)
    ? undefined
    : 'It should be a 32 alphanumeric characters.',
);
