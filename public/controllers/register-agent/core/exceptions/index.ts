export class NoOptionFoundException extends Error {
  constructor(osName: string, architecture: string, extension: string) {
    super(
      `No OS option found for "${osName}" "${architecture}" "${extension}".Please check the OS definitions."`,
    );
  }
}

export class NoOSOptionFoundException extends Error {
  constructor(osName: string) {
    super(
      `No OS option found for "${osName}".Please check the OS definitions."`,
    );
  }
}

export class NoStartCommandDefinitionException extends Error {
  constructor(osName: string, architecture: string, extension: string) {
    super(
      `No start command definition found for "${osName}" "${architecture}" "${extension}". Please check the OS definitions.`,
    );
  }
}

export class NoInstallCommandDefinitionException extends Error {
  constructor(osName: string, architecture: string, extension: string) {
    super(
      `No install command definition found for "${osName}" "${architecture}" "${extension}". Please check the OS definitions.`,
    );
  }
}

export class NoPackageURLDefinitionException extends Error {
  constructor(osName: string, architecture: string, extension: string) {
    super(
      `No package URL definition found for "${osName}" "${architecture}" "${extension}". Please check the OS definitions.`,
    );
  }
}

export class NoOptionalParamFoundException extends Error {
  constructor(paramName: string) {
    super(
      `Optional parameter "${paramName}" not found. Please check the optional parameters definitions.`,
    );
  }
}

export class DuplicatedOSException extends Error {
  constructor(osName: string) {
    super(`Duplicate OS name found: ${osName}`);
  }
}

export class DuplicatedOSOptionException extends Error {
  constructor(osName: string, architecture: string, extension: string) {
    super(
      `Duplicate OS option found for "${osName}" "${architecture}" "${extension}"`,
    );
  }
}

export class WazuhVersionUndefinedException extends Error {
  constructor() {
    super(`Wazuh version not defined`);
  }
}

export class NoOSSelectedException extends Error {
  constructor() {
    super(`OS not selected. Please select`);
  }
}

export class NoArchitectureSelectedException extends Error {
  constructor() {
    super(`Architecture not selected. Please select`);  
  }
}

export class NoExtensionSelectedException extends Error {
  constructor() {
    super(`Extension not selected. Please select`);
  }
}
