import {
  ICommandsResponse,
  IOSCommandsDefinition,
  IOSDefinition,
  IOptionalParams,
  tOS,
  tPackageExtensions,
} from '../types';
import { ICommandCreator } from '../types';
import { searchOSDefinitions, validateOSDefinitionsDuplicated } from '../services/search-os-definitions.service';
import { IOperationSystem } from '../../domain/OperatingSystem';

export class CommandCreator implements ICommandCreator {
  // operating system 
  os: tOS | null = null;
  osDefinitionSelected: IOSCommandsDefinition | null = null;

  constructor(
    public osDefinitions: IOSDefinition[],
    protected optionalParams: IOptionalParams,
    public wazuhVersion: string,
  ) {
    // validate os definitions received
    validateOSDefinitionsDuplicated(this.osDefinitions);
  }

  selectOS(params: IOperationSystem) {
    try {
      this.osDefinitionSelected = this.checkIfOSisValid(params);
      this.os = params.name;
    }catch(error){
      this.osDefinitionSelected = null;
      this.os = null;
    }
  }
  /**
   * 
   * @param params 
   */
  private checkIfOSisValid(params: IOperationSystem): IOSCommandsDefinition {
    const { name, architecture, extension } = params;
    if (!name) {
      throw new Error('OS not selected');
    }
    if(!architecture) {
      throw new Error('Architecture not selected');
    }
    if(!extension) {
      throw new Error('Extension not selected');
    }

    const option = searchOSDefinitions(this.osDefinitions, {
      name,
      architecture,
      extension,
    })
    return option;
  }

  getUrlPackage(): string {
    if(!this.osDefinitionSelected) {
      throw new Error('OS not selected. Please select an OS');
    }
    return this.osDefinitionSelected.urlPackage({
      wazuhVersion: this.wazuhVersion,
      architecture: this.osDefinitionSelected.architecture as string,
      extension: this.osDefinitionSelected.extension as tPackageExtensions,
    })
  }

  getInstallCommand(): string {
    if(!this.osDefinitionSelected) {
      throw new Error('OS not selected. Please select an OS');
    }

    return this.osDefinitionSelected.installCommand({
      name: this.os as tOS,
      architecture: this.osDefinitionSelected.architecture as string,
      extension: this.osDefinitionSelected.extension as tPackageExtensions,
      urlPackage: this.getUrlPackage(),
      wazuhVersion: this.wazuhVersion,
    });
  }

  getStartCommand(): string {
    if(!this.osDefinitionSelected) {
      throw new Error('OS not selected. Please select an OS');
    }

    return this.osDefinitionSelected.startCommand({
      name: this.os as tOS,
      architecture: this.osDefinitionSelected.architecture as string,
      extension: this.osDefinitionSelected.extension as tPackageExtensions,
      wazuhVersion: this.wazuhVersion,
    })
  }

  getAllCommands(): ICommandsResponse {
    if(!this.osDefinitionSelected) {
      throw new Error('OS not selected. Please select an OS');
    }

    return {
      wazuhVersion: this.wazuhVersion,
      os: this.os as tOS,
      architecture: this.osDefinitionSelected.architecture as string,
      extension: this.osDefinitionSelected.extension as tPackageExtensions,
      url_package: this.getUrlPackage(),
      install_command: this.getInstallCommand(),
      start_command: this.getStartCommand(),
    }
  }

  getOptionalParams() {
    return {};
  }
}
