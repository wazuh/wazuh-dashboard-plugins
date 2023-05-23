import { NoInstallCommandDefinitionException, NoOSOptionFoundException, NoOptionFoundException, NoPackageURLDefinitionException } from '../exceptions';
import { searchOSDefinitions } from '../services/search-os-definitions.service';
import { OSDefinition, tOS, tPackageExtensions, tPackageManagerTypes } from '../types';


/* ToDO:
  - Add exceptions clases with custom messages 
  that say what option is invalid and the specific property not found
*/
export class InstallCommandCreator {
  constructor(private osDefinitions: OSDefinition[], private version: string) {}

  getInstallCommand(
    osName: tOS,
    architecture: string,
    extension: tPackageExtensions,
    packageManager: tPackageManagerTypes,
    packageUrl: string,
  ) {
    
    const osDefinitionOption = searchOSDefinitions({
      osDefinitions: this.osDefinitions,
      osName,
      architecture,
      extension,
      packageManager,
    })

    if (!osDefinitionOption.installCommand) {
      throw new NoInstallCommandDefinitionException(osName, architecture, extension, packageManager);
    }

    if(!packageUrl || packageUrl === ''){
        throw new NoPackageURLDefinitionException(osName, architecture, extension, packageManager);
    }

    return osDefinitionOption.installCommand({
      ...osDefinitionOption,
      urlPackage: packageUrl,
      version: this.version,
    });
  }
}
