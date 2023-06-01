import { CommandFinder } from './command-finder';
import { InstallCommandCreator } from './register-agent-commands/install-command-creator/install-command-creator';
import {
  IDefinitionsInput,
  IOSDefinition,
  IOptionalParams,
  tPackageManagerTypes,
} from './register-agent-commands/types';
import { URLPackageFinder } from './register-agent-commands/url-package-finder/url-package-finder';
import { ICommandCreator, ICommandFinder } from './types';

export class CommandCreator implements ICommandCreator {
  commandFinder: ICommandFinder;
  installCommandCreator: InstallCommandCreator; // change for interface
  urlPackageFinder: URLPackageFinder;
  os: string = '';
  archictecture: string = '';
  extension: string = '';
  packageManager: string = '';
  constructor(
    public osDefinitions: IOSDefinition[],
    protected optionalParams: IOptionalParams,
    public version: string,
  ) {
    this.commandFinder = new CommandFinder(osDefinitions, version);
    this.installCommandCreator = new InstallCommandCreator(
      osDefinitions,
      version,
    );
    this.urlPackageFinder = new URLPackageFinder(osDefinitions, version);
  }

  selectOS(params: IDefinitionsInput) {
    this.os = params.osName;
    this.archictecture = params.architecture;
    this.extension = params.extension;
    this.packageManager = params.packageManager;
    return {
      os: params.osName,
      version: this.version,
      architecture: params.architecture,
      installCommand: this.getInstallCommand() as string,
      startCommand: this.getStartCommand() as string,
    };
  }

  checkIfOsIsSelected() {
    if (!this.os) {
      throw new Error('OS not selected');
    }

    if (!this.archictecture) {
      throw new Error('Architecture not selected');
    }
  }

  getInstallCommand() {
    this.checkIfOsIsSelected();
    // change for a install that receive only the osDefinition
    return this.installCommandCreator.getInstallCommand(
      this.os as any,
      this.archictecture,
      this.extension as any,
      this.packageManager as tPackageManagerTypes,
      this.urlPackageFinder.getURLPackage(
        this.os as any,
        this.archictecture,
        this.extension as any,
        this.packageManager as tPackageManagerTypes,
        this.version,
      ),
    );
  }

  getStartCommand() {
    return '';
  }

  getOptionalParams() {
    return {};
  }
}
