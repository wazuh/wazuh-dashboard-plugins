import { NoInstallCommandDefinitionException, NoPackageURLDefinitionException, WazuhVersionUndefinedException } from "../exceptions";
import { IOSCommandsDefinition, IOptionalParameters, tOS } from "../types";

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