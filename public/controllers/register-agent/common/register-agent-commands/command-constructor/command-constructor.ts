import { ICommandConstructorInput, OSDefinition, tOS, tPackageExtensions, tPackageManagerTypes } from "../types";
import { URLPackageFinder } from "../url-package-finder/url-package-finder";

interface IRegisterAgentCommandInput {
  osName: tOS;
  architecture: string;
  extension: tPackageExtensions;
  packageManager: tPackageManagerTypes;
}

/**
 * This class will receive the OS definition and return the commands to register agent and install the package
 */
export class RegisterAgentCommandConstructor {
  version: string = '4.4.2';
  targetVersion: string = '';
  URLpackageFinder: URLPackageFinder;

  constructor(private osDefinitions: OSDefinition[]) {
    this.URLpackageFinder = new URLPackageFinder(osDefinitions, this.version);
    
  }

  setVersion(version: string){
    this.version = version;
  }

  setTargetVersion(targetVersion: string){
    this.targetVersion = targetVersion;
  }

  getRegisterAgentCommand(inputs: ICommandConstructorInput){
    const {
      os,
    } = inputs;
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
