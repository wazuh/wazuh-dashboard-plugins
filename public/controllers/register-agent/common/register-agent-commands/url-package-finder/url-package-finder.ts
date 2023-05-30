import {
  NoOSOptionFoundException,
  NoOptionFoundException,
} from '../exceptions';
import { searchOSDefinitions } from '../services/search-os-definitions.service';
import { IOSDefinition, tOS, tPackageExtensions, tPackageManagerTypes } from '../types';
/**
 * This class is responsible for finding the URL of the package to download
 * for the agent installation.
 * It receives the current version of the agent and the OS name and architecture
 */
export class URLPackageFinder {
  constructor(
    private osDefinitions: IOSDefinition[],
    protected currentVersion: string,
  ) {}

  getURLPackage(
    osName: tOS,
    architecture: string,
    extension: tPackageExtensions,
    packageManager: tPackageManagerTypes,
    currentVersion?: string,
  ): string {
    
    const option = searchOSDefinitions(this.osDefinitions, {
      osName,
      architecture,
      extension,
      packageManager,
    })

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
