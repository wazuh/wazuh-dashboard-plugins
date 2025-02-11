// eslint-disable-next-line unicorn/custom-error-definition
export class NoOptionFoundException extends Error {
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor(osName: string, architecture: string) {
    super(
      `No OS option found for "${osName}" "${architecture}". Please check the OS definitions."`,
    );
  }
}

// eslint-disable-next-line unicorn/custom-error-definition
export class NoOSOptionFoundException extends Error {
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor(osName: string) {
    super(
      `No OS option found for "${osName}". Please check the OS definitions."`,
    );
  }
}

// eslint-disable-next-line unicorn/custom-error-definition
export class NoStartCommandDefinitionException extends Error {
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor(osName: string, architecture: string) {
    super(
      `No start command definition found for "${osName}" "${architecture}". Please check the OS definitions.`,
    );
  }
}

// eslint-disable-next-line unicorn/custom-error-definition
export class NoInstallCommandDefinitionException extends Error {
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor(osName: string, architecture: string) {
    super(
      `No install command definition found for "${osName}" "${architecture}". Please check the OS definitions.`,
    );
  }
}

// eslint-disable-next-line unicorn/custom-error-definition
export class NoPackageURLDefinitionException extends Error {
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor(osName: string, architecture: string) {
    super(
      `No package URL definition found for "${osName}" "${architecture}". Please check the OS definitions.`,
    );
  }
}

// eslint-disable-next-line unicorn/custom-error-definition
export class NoOptionalParamFoundException extends Error {
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor(paramName: string) {
    super(
      `Optional parameter "${paramName}" not found. Please check the optional parameters definitions.`,
    );
  }
}

// eslint-disable-next-line unicorn/custom-error-definition
export class DuplicatedOSException extends Error {
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor(osName: string) {
    super(`Duplicate OS name found: ${osName}`);
  }
}

// eslint-disable-next-line unicorn/custom-error-definition
export class DuplicatedOSOptionException extends Error {
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor(osName: string, architecture: string) {
    super(`Duplicate OS option found for "${osName}" "${architecture}"`);
  }
}

// eslint-disable-next-line unicorn/custom-error-definition
export class WazuhVersionUndefinedException extends Error {
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor() {
    super(`Wazuh version not defined`);
  }
}

// eslint-disable-next-line unicorn/custom-error-definition
export class NoOSSelectedException extends Error {
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor() {
    super(`OS not selected. Please select`);
  }
}

// eslint-disable-next-line unicorn/custom-error-definition
export class NoArchitectureSelectedException extends Error {
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor() {
    super(`Architecture not selected. Please select`);
  }
}
