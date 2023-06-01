import { NoInstallCommandDefinitionException, NoPackageURLDefinitionException } from "../exceptions";
import { IOSCommandsDefinition } from "../types";

export const getInstallCommandByOS = (osDefinition: IOSCommandsDefinition, packageUrl: string, version: string, osName: string) => {
    
    if (!osDefinition.installCommand) {
        throw new NoInstallCommandDefinitionException(osName, osDefinition.architecture, osDefinition.extension);
      }
  
      if(!packageUrl || packageUrl === ''){
          throw new NoPackageURLDefinitionException(osName, osDefinition.architecture, osDefinition.extension);
      }

    if(!version || version === ''){
        throw new Error('No version found'); // create exception
    }
    
    return osDefinition.installCommand({
        ...osDefinition,
        urlPackage: packageUrl,
        version,
    });
}