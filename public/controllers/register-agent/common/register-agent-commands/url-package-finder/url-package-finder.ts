import {
  NoOSOptionFoundException,
  NoOptionFoundException,
} from '../exceptions';
import { OSDefinition, tOS, tPackageExtensions } from '../types';
/**
 * This class is responsible for finding the URL of the package to download
 * for the agent installation.
 * It receives the current version of the agent and the OS name and architecture
 */
export class URLPackageFinder {
  constructor(
    private osDefinitions: OSDefinition[],
    protected currentVersion: string,
  ) {}

  getURLPackage(
    osName: tOS,
    architecture: string,
    extension: tPackageExtensions,
    currentVersion?: string,
  ): string {
    const osDefinition = this.osDefinitions.find(def => def.name === osName);

    if (!osDefinition) {
      throw new NoOSOptionFoundException(osName);
    }

    const option = osDefinition.options.find(opt => {
      return opt.architecture === architecture && opt.extension === extension;
    });

    if (!option) {
      throw new NoOptionFoundException(osName, architecture, extension);
    }

    return option.urlPackage({
      version: currentVersion || this.currentVersion,
      architecture,
      extension,
    });
  }
}
