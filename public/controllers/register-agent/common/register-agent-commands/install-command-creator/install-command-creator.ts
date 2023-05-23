import { NoInstallCommandDefinitionException, NoOSOptionFoundException, NoOptionFoundException, NoPackageURLDefinitionException } from '../exceptions';
import { OSDefinition } from '../types';


/* ToDO:
  - Add exceptions clases with custom messages 
  that say what option is invalid and the specific property not found
*/
export class InstallCommandCreator {
  constructor(private osDefinitions: OSDefinition[], private version: string) {}

  getInstallCommand(
    osName: string,
    architecture: string,
    extension: string,
    packageManager: string,
    packageUrl: string,
  ) {
    const osDefinition = this.osDefinitions.find(os => os.name === osName);
    if (!osDefinition) {
      throw new NoOSOptionFoundException(osName)
    }
    const osDefinitionOption = osDefinition.options.find(
      option =>
        option.architecture === architecture &&
        option.extension === extension &&
        option.packageManager === packageManager,
    );
    if (!osDefinitionOption) {
      throw new NoOptionFoundException(osName, architecture, extension);
    }

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
