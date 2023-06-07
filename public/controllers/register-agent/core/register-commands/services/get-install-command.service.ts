import { NoInstallCommandDefinitionException, NoPackageURLDefinitionException, WazuhVersionUndefinedException } from "../exceptions";
import { IOSCommandsDefinition, IOptionalParameters, tOS } from "../types";

/**
 * Returns the installation command for a given operating system.
 * @param {IOSCommandsDefinition} osDefinition - The definition of the operating system.
 * @param {string} packageUrl - The URL of the package to install.
 * @param {string} version - The version of Wazuh to install.
 * @param {string} osName - The name of the operating system.
 * @param {IOptionalParameters} [optionals] - Optional parameters to include in the command.
 * @returns {string} The installation command for the given operating system.
 * @throws {NoInstallCommandDefinitionException} If the installation command is not defined for the given operating system.
 * @throws {NoPackageURLDefinitionException} If the package URL is not defined.
 * @throws {WazuhVersionUndefinedException} If the Wazuh version is not defined.
 */
export const getInstallCommandByOS = (osDefinition: IOSCommandsDefinition, packageUrl: string, version: string, osName: string, optionals?: IOptionalParameters) => {
    
    if (!osDefinition.installCommand) {
        throw new NoInstallCommandDefinitionException(osName, osDefinition.architecture, osDefinition.extension);
      }
  
      if(!packageUrl || packageUrl === ''){
          throw new NoPackageURLDefinitionException(osName, osDefinition.architecture, osDefinition.extension);
      }

    if(!version || version === ''){
        throw new WazuhVersionUndefinedException();
    }
    
    return osDefinition.installCommand({
        urlPackage: packageUrl,
        wazuhVersion: version,
        name: osName as tOS,
        architecture: osDefinition.architecture,
        extension: osDefinition.extension,
        optionals,
    });
}