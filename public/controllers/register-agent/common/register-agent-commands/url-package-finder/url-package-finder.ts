
import { OSDefinition, tOS, tPackageExtensions } from '../types';

/* ToDO:
  - Add exceptions clases with custom messages 
  that say what option is invalid and the specific property not found
*/
export class NotOptionFoundException extends Error {
  constructor(osName: tOS, architecture: string, extension: tPackageExtensions) {
    super(`No OS option found for "${osName}" "${architecture}" "${extension}"`);
  }
}
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
    const osDefinition = this.osDefinitions.find(
      def =>
        def.name === osName &&
        def.options.some(
          opt =>
            opt.architecture === architecture && opt.extension === extension,
        ),
    );
    if (!osDefinition) {
      throw new NotOptionFoundException(osName, architecture, extension);
    }
    const option = osDefinition.options.find(
      opt => opt.architecture === architecture && opt.extension === extension,
    );
    if (!option) {
        throw new NotOptionFoundException(osName, architecture, extension);
    }

    return option.urlPackage({
      version: currentVersion || this.currentVersion,
      architecture,
      extension,
    });
  }
}
