import {
  ICommandsResponse,
  IOSCommandsDefinition,
  IOSDefinition,
  IOptionalParams,
  tOS,
  tPackageExtensions,
} from '../types';
import { ICommandCreator } from '../types';
import { searchOSDefinitions, validateOSDefinitionHasDuplicatedOptions, validateOSDefinitionsDuplicated } from '../services/search-os-definitions.service';
import { IOperationSystem } from '../../domain/OperatingSystem';

export class CommandCreator implements ICommandCreator {
  os: tOS | null = null;
  osDefinitionSelected: IOSCommandsDefinition | null = null;

  constructor(
    public osDefinitions: IOSDefinition[],
    protected optionalParams: IOptionalParams,
    public wazuhVersion: string,
  ) {
    // validate os definitions received
    validateOSDefinitionsDuplicated(this.osDefinitions);
    validateOSDefinitionHasDuplicatedOptions(this.osDefinitions);
  }

  /**
   * This method selects the operating system to use based on the given parameters
   * @param params - The operating system parameters to select
   */
  selectOS(params: IOperationSystem) {
    try {
      // Check if the selected operating system is valid
      this.osDefinitionSelected = this.checkIfOSisValid(params);
      // Set the selected operating system
      this.os = params.name;
    } catch (error) {
      // If the selected operating system is not valid, reset the selected OS and OS definition
      this.osDefinitionSelected = null;
      this.os = null;
    }
  }

  /**
   * This method checks if the selected operating system is valid
   * @param params - The operating system parameters to check
   * @returns The selected operating system definition
   * @throws An error if the operating system is not valid
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

  /**
   * This method gets the URL package for the selected operating system
   * @returns The URL package for the selected operating system
   * @throws An error if the operating system is not selected
   */
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

  /**
   * This method gets the install command for the selected operating system
   * @returns The install command for the selected operating system
   * @throws An error if the operating system is not selected
   */
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

  /**
   * This method gets the start command for the selected operating system
   * @returns The start command for the selected operating system
   * @throws An error if the operating system is not selected
   */
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

  /**
   * This method gets all the commands for the selected operating system
   * @returns An object containing all the commands for the selected operating system
   * @throws An error if the operating system is not selected
   */
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

  /**
   * This method gets the optional parameters for the command creator
   * @returns An object containing the optional parameters for the command creator
   */
  getOptionalParams() {
    return {};
  }
}
