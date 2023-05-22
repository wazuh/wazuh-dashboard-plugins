import { OSDefinition } from '../types';


/* ToDO:
  - Add exceptions clases with custom messages 
  that say what option is invalid and the specific property not found
*/
export class InstallCommandConstructor {
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
      throw new Error(`OS "${osName}" not found`);
    }
    const osDefinitionOption = osDefinition.options.find(
      option =>
        option.architecture === architecture &&
        option.extension === extension &&
        option.packageManager === packageManager,
    );
    if (!osDefinitionOption) {
      throw new Error(
        `OS "${osName}" with architecture "${architecture}" and extension "${extension}" and package manager "${packageManager}" not found`,
      );
    }

    if (!osDefinitionOption.installCommand) {
      throw new Error(
        `OS "${osName}" with architecture "${architecture}" and extension "${extension}" and package manager "${packageManager}" does not have install command`,
      );
    }

    if(!packageUrl || packageUrl === ''){
        throw new Error('Package definition is missing packageUrl');
    }

    return osDefinitionOption.installCommand({
      ...osDefinitionOption,
      urlPackage: packageUrl,
      version: this.version,
    });
  }
}
