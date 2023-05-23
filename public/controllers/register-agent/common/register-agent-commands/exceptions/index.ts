export class NoOptionFoundException extends Error {
  constructor(
    osName: string,
    architecture: string,
    extension: string,
  ) {
    super(
      `No OS option found for "${osName}" "${architecture}" "${extension}.Please check the OS definitions."`,
    );
  }
}

export class NoOSOptionFoundException extends Error {
  constructor(osName: string) {
    super(
      `No OS option found for "${osName}.Please check the OS definitions."`,
    );
  }
}

export class NoInstallCommandDefinitionException extends Error {
    constructor(osName: string, architecture: string, extension: string, packageManager: string) {
        super(`No install command definition found for "${osName}" "${architecture}" "${extension}" "${packageManager}". Please check the OS definitions.`);
    }
}

export class NoPackageURLDefinitionException extends Error {
    constructor(osName: string, architecture: string, extension: string, packageManager: string) {
        super(`No package URL definition found for "${osName}" "${architecture}" "${extension}" "${packageManager}". Please check the OS definitions.`);
    }
}