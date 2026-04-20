import {
  NoInstallCommandDefinitionException,
  NoPackageURLDefinitionException,
  WazuhVersionUndefinedException,
} from '../exceptions';
import {
  IOSCommandsDefinition,
  IOperationSystem,
  IOptionalParameters,
} from '../types';

/**
 * Returns the installation command for a given operating system.
 * @param {IOSCommandsDefinition<OS, Param>} osDefinition - The definition of the operating system.
 * @param {string} version - The version of Wazuh to install.
 * @param {string} osName - The name of the operating system.
 * @param {IOptionalParameters<T>} [optionals] - Optional parameters to include in the command.
 * @returns {string} The installation command for the given operating system.
 * @throws {NoInstallCommandDefinitionException} If the installation command is not defined for the given operating system.
 * @throws {NoPackageURLDefinitionException} If the package URL is not defined.
 * @throws {WazuhVersionUndefinedException} If the Wazuh version is not defined.
 */
export function getInstallCommandByOS<
  OS extends IOperationSystem,
  Params extends string,
>(
  osDefinition: IOSCommandsDefinition<OS, Params>,
  version: string,
  osName: string,
  optionals?: IOptionalParameters<Params>,
) {
  if (!osDefinition.installCommand) {
    throw new NoInstallCommandDefinitionException(
      osName,
      osDefinition.architecture,
    );
  }

  if (!version || version === '') {
    throw new WazuhVersionUndefinedException();
  }

  const baseProps = {
    wazuhVersion: version,
    name: osName as OS['name'],
    architecture: osDefinition.architecture,
  };

  const packageName = osDefinition.packageName(baseProps);
  const packageUrl = osDefinition.urlPackage({ ...baseProps, packageName });

  if (!packageUrl || packageUrl === '') {
    throw new NoPackageURLDefinitionException(
      osName,
      osDefinition.architecture,
    );
  }

  return osDefinition.installCommand({
    ...baseProps,
    urlPackage: packageUrl,
    packageName,
    optionals,
  });
}
