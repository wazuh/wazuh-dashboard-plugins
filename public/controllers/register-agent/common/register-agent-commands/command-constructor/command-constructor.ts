import { InstallCommandCreator } from "../install-command-creator/install-command-creator";
import { validateOSDefinitionHasDuplicatedOptions, validateOSDefinitionsDuplicated } from "../services/search-os-definitions.service";
import { StartCommandCreator } from "../start-command-creator/start-command-creator";
import { ICommandConstructorInput, IOptionalParams, IOSDefinition, tOS, tPackageExtensions, tPackageManagerTypes } from "../types";
import { URLPackageFinder } from "../url-package-finder/url-package-finder";

interface IRegisterAgentCommandInput {
  osName: tOS;
  architecture: string;
  extension: tPackageExtensions;
  packageManager: tPackageManagerTypes;
}

interface IRegisterAgentCommandConstructor {
  version: string;
  URLpackageFinder: URLPackageFinder;
  installCommandCreator: InstallCommandCreator;
  startCommandCreator: StartCommandCreator;
}

enum EStatusMessages {
  OS_INCOMPLETE = 'Please select the Operating system.',
  EXTENSION_INCOMPLETE = 'Please select the extension.',
  ARCHITECTURE_INCOMPLETE = 'Please select the architecture.',
}





/**
 * This class will receive the OS definition and return the commands to register agent and install the package
 */
export class RegisterAgentCommandConstructor implements IRegisterAgentCommandConstructor{
  version: string = '4.4.2';
  URLpackageFinder: URLPackageFinder;
  installCommandCreator: InstallCommandCreator;
  startCommandCreator: StartCommandCreator;
  _protocol: 'UDP' | 'TCP' | null = null;
  _serverAddress: string | null = null;
  _agentName: string | null = null;
  _group: string | null = null;
  _osName: tOS | null = null;
  _architecture: string | null = null;
  _extension: tPackageExtensions | null = null;
  _packageManager: tPackageManagerTypes | null = null;


  constructor(private osDefinitions: IOSDefinition[], private optionsParams?: IOptionalParams) {
    this.URLpackageFinder = new URLPackageFinder(osDefinitions, this.version);
    this.installCommandCreator = new InstallCommandCreator(osDefinitions, this.version);
    this.startCommandCreator = new StartCommandCreator(osDefinitions, this.version);
  }

  selectOS(osName: tOS, architecture: string, extension: tPackageExtensions, packageManager: tPackageManagerTypes){
    this._osName = osName;
    this._architecture = architecture;
    this._extension = extension;
    this._packageManager = packageManager;
    this.checkRequiredFields();
  }

  validateDefinitions() {
    validateOSDefinitionsDuplicated(this.osDefinitions);
    validateOSDefinitionHasDuplicatedOptions(this.osDefinitions);
  }

  checkRequiredFields(){
    if(!this._osName){
      return EStatusMessages.OS_INCOMPLETE;
    }

    if(!this._architecture){
      return EStatusMessages.ARCHITECTURE_INCOMPLETE;
    }

    if(!this._extension){
      return EStatusMessages.EXTENSION_INCOMPLETE;
    }
  }

  setProtocol(protocol: 'UDP' | 'TCP'){
  }

  setServerAddress(serverAddress: string){

  }

  setAgentName(agentName: string){

  }

  setGroup(group: string){

  }

  getInstallCommand(){

  }

  getStartCommand(){
  }


}

interface PackageURLFinderInput {
  version: string;
  targetVersion: string;
  os: tOS;
  extension: tPackageExtensions;
  architecture: string;
  packageManager: tPackageManagerTypes;
}

// create a class that receives the os definition and return the entire command to be executed

/*
const packagesArchitecture: tPackagesArchitecture = {
  yum: 'rpm',
  apt: 'deb',
  zypper: 'rpm',
  win: 'msi',
  mac: 'pkg',
  pkgadd: 'pkg',
  pkg: 'p5p',
  rpm: 'rpm',
  aix: 'rpm',
  hp: 'tar',
  apk: 'apk',
};
*/
