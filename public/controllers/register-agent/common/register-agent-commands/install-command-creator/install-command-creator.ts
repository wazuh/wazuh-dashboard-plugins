import { NoInstallCommandDefinitionException, NoOSOptionFoundException, NoOptionFoundException, NoPackageURLDefinitionException } from '../exceptions';
import { searchOSDefinitions } from '../services/search-os-definitions.service';
import { IOSDefinition, tOS, tPackageExtensions, tPackageManagerTypes } from '../types';

export class InstallCommandCreator {
  constructor(private osDefinitions: IOSDefinition[], private version: string) {}

  getInstallCommand(
    osName: tOS,
    architecture: string,
    extension: tPackageExtensions,
    packageManager: tPackageManagerTypes,
    packageUrl: string,
  ) {
    
    const osDefinitionOption = searchOSDefinitions(this.osDefinitions,{
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
