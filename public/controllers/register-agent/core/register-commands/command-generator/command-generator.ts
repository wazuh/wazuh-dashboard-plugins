import {
  ICommandsResponse,
  IOSCommandsDefinition,
  IOSDefinition,
  IOperationSystem,
  IOptionalParameters,
  IOptionalParametersManager,
  tOS,
  tOptionalParams,
  tPackageExtensions,
} from '../types';
import { ICommandGenerator } from '../types';
import {
  searchOSDefinitions,
  validateOSDefinitionHasDuplicatedOptions,
  validateOSDefinitionsDuplicated,
} from '../services/search-os-definitions.service';
import { OptionalParametersManager } from '../optional-parameters-manager/optional-parameters-manager';
import { NoArchitectureSelectedException, NoExtensionSelectedException, NoOSSelectedException, WazuhVersionUndefinedException } from '../exceptions';

export class CommandGenerator implements ICommandGenerator {
  os: tOS | null = null;
  osDefinitionSelected: IOSCommandsDefinition | null = null;
  optionalsManager: IOptionalParametersManager;
  protected optionals: IOptionalParameters | object = {};
  constructor(
    public osDefinitions: IOSDefinition[],
    protected optionalParams: tOptionalParams,
    public wazuhVersion: string,
  ) {
    // validate os definitions received
    validateOSDefinitionsDuplicated(this.osDefinitions);
    validateOSDefinitionHasDuplicatedOptions(this.osDefinitions);
    if(wazuhVersion == ''){
      throw new WazuhVersionUndefinedException();
    }
    this.optionalsManager = new OptionalParametersManager(optionalParams);
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
      throw error;
    }
  }

  /**
   * This method adds the optional parameters to use based on the given parameters
   * @param props - The optional parameters to select
   * @returns The selected optional parameters
   */
  addOptionalParams(props: IOptionalParameters): void {
    // Get all the optional parameters based on the given parameters
    this.optionals = this.optionalsManager.getAllOptionalParams(props);
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
      throw new NoOSSelectedException();
    }
    if (!architecture) {
      throw new NoArchitectureSelectedException();
    }
    if (!extension) {
      throw new NoExtensionSelectedException();
    }

    const option = searchOSDefinitions(this.osDefinitions, {
      name,
      architecture,
      extension,
    });
    return option;
  }

  /**
   * This method gets the URL package for the selected operating system
   * @returns The URL package for the selected operating system
   * @throws An error if the operating system is not selected
   */
  getUrlPackage(): string {
    if (!this.osDefinitionSelected) {
      throw new NoOSSelectedException();
    }
    return this.osDefinitionSelected.urlPackage({
      wazuhVersion: this.wazuhVersion,
      architecture: this.osDefinitionSelected.architecture as string,
      extension: this.osDefinitionSelected.extension as tPackageExtensions,
      name: this.os as tOS,
    });
  }

  /**
   * This method gets the install command for the selected operating system
   * @returns The install command for the selected operating system
   * @throws An error if the operating system is not selected
   */
  getInstallCommand(): string {
    if (!this.osDefinitionSelected) {
      throw new NoOSSelectedException();
    }

    return this.osDefinitionSelected.installCommand({
      name: this.os as tOS,
      architecture: this.osDefinitionSelected.architecture as string,
      extension: this.osDefinitionSelected.extension as tPackageExtensions,
      urlPackage: this.getUrlPackage(),
      wazuhVersion: this.wazuhVersion,
      optionals: this.optionals as IOptionalParameters,
    });
  }

  /**
   * This method gets the start command for the selected operating system
   * @returns The start command for the selected operating system
   * @throws An error if the operating system is not selected
   */
  getStartCommand(): string {
    if (!this.osDefinitionSelected) {
      throw new NoOSSelectedException();
    }

    return this.osDefinitionSelected.startCommand({
      name: this.os as tOS,
      architecture: this.osDefinitionSelected.architecture as string,
      extension: this.osDefinitionSelected.extension as tPackageExtensions,
      wazuhVersion: this.wazuhVersion,
      optionals: this.optionals as IOptionalParameters,
    });
  }

  /**
   * This method gets all the commands for the selected operating system
   * @returns An object containing all the commands for the selected operating system
   * @throws An error if the operating system is not selected
   */
  getAllCommands(): ICommandsResponse {
    if (!this.osDefinitionSelected) {
      throw new NoOSSelectedException();
    }

    return {
      wazuhVersion: this.wazuhVersion,
      os: this.os as tOS,
      architecture: this.osDefinitionSelected.architecture as string,
      extension: this.osDefinitionSelected.extension as tPackageExtensions,
      url_package: this.getUrlPackage(),
      install_command: this.getInstallCommand(),
      start_command: this.getStartCommand(),
      optionals: this.optionals,
    };
  }
}
