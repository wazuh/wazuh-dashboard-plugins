import {
  ICommandsResponse,
  IOSCommandsDefinition,
  IOSDefinition,
  IOperationSystem,
  IOptionalParameters,
  IOptionalParametersManager,
  TOptionalParams,
  ICommandGenerator,
} from '../types';
import {
  searchOSDefinitions,
  validateOSDefinitionHasDuplicatedOptions,
  validateOSDefinitionsDuplicated,
} from '../services/search-os-definitions.service';
import { OptionalParametersManager } from '../optional-parameters-manager/optional-parameters-manager';
import {
  NoArchitectureSelectedException,
  NoOSSelectedException,
  WazuhVersionUndefinedException,
} from '../exceptions';
import { version } from '../../../../../../../package.json';

export class CommandGenerator<
  OS extends IOperationSystem,
  Params extends string,
> implements ICommandGenerator<OS, Params>
{
  os: OS['name'] | null = null;
  osDefinitionSelected: IOSCommandsDefinition<OS, Params> | null = null;
  optionalsManager: IOptionalParametersManager<Params>;
  protected optionals: IOptionalParameters<Params> | object = {};

  constructor(
    public osDefinitions: IOSDefinition<OS, Params>[],
    protected optionalParams: TOptionalParams<Params>,
    public wazuhVersion: string = version,
  ) {
    // validate os definitions received
    validateOSDefinitionsDuplicated(this.osDefinitions);
    validateOSDefinitionHasDuplicatedOptions(this.osDefinitions);

    if (wazuhVersion === '') {
      throw new WazuhVersionUndefinedException();
    }

    this.optionalsManager = new OptionalParametersManager(optionalParams);
  }

  /**
   * This method selects the operating system to use based on the given parameters
   * @param params - The operating system parameters to select
   */
  selectOS(params: OS) {
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
  addOptionalParams(props: IOptionalParameters<Params>, selectedOS?: OS): void {
    // Get all the optional parameters based on the given parameters
    this.optionals = this.optionalsManager.getAllOptionalParams(
      props,
      selectedOS,
    );
  }

  /**
   * This method checks if the selected operating system is valid
   * @param params - The operating system parameters to check
   * @returns The selected operating system definition
   * @throws An error if the operating system is not valid
   */
  private checkIfOSisValid(params: OS): IOSCommandsDefinition<OS, Params> {
    const { name, architecture } = params;

    if (!name) {
      throw new NoOSSelectedException();
    }

    if (!architecture) {
      throw new NoArchitectureSelectedException();
    }

    const option = searchOSDefinitions(this.osDefinitions, {
      name,
      architecture,
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
      architecture: this.osDefinitionSelected
        .architecture as OS['architecture'],
      name: this.os as OS['name'],
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
      name: this.os as OS['name'],
      architecture: this.osDefinitionSelected
        .architecture as OS['architecture'],
      urlPackage: this.getUrlPackage(),
      wazuhVersion: this.wazuhVersion,
      optionals: this.optionals as IOptionalParameters<Params>,
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
      name: this.os as OS['name'],
      architecture: this.osDefinitionSelected
        .architecture as OS['architecture'],
      wazuhVersion: this.wazuhVersion,
      optionals: this.optionals as IOptionalParameters<Params>,
    });
  }

  /**
   * This method gets all the commands for the selected operating system
   * @returns An object containing all the commands for the selected operating system
   * @throws An error if the operating system is not selected
   */
  getAllCommands(): ICommandsResponse<Params> {
    if (!this.osDefinitionSelected) {
      throw new NoOSSelectedException();
    }

    return {
      wazuhVersion: this.wazuhVersion,
      os: this.os as OS['name'],
      architecture: this.osDefinitionSelected
        .architecture as OS['architecture'],
      url_package: this.getUrlPackage(),
      install_command: this.getInstallCommand(),
      start_command: this.getStartCommand(),
      optionals: this.optionals,
    };
  }

  /**
   * Returns the optional paramaters processed
   * @returns optionals
   */
  getOptionalParamsCommands(): IOptionalParameters<Params> | object {
    return this.optionals;
  }
}
