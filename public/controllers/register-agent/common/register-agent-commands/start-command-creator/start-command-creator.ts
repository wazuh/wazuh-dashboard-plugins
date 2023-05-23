import { NoStartCommandDefinitionException } from "../exceptions";
import { searchOSDefinitions } from "../services/search-os-definitions.service";
import { OSDefinition, tOS, tPackageExtensions, tPackageManagerTypes } from "../types";

export class StartCommandCreator {
    constructor(private osDefinitions: OSDefinition[], private version: string) {}

    getStartCommand(
        osName: tOS,
        architecture: string,
        extension: tPackageExtensions,
        packageManager: tPackageManagerTypes,
    ){
        const osDefinitionOption = searchOSDefinitions(this.osDefinitions,{
            osName,
            architecture,
            extension,
            packageManager,
        })

        if(!osDefinitionOption.startCommand){
            throw new NoStartCommandDefinitionException(osName, architecture, extension, packageManager);
        }

        return osDefinitionOption.startCommand({
            extension,
            architecture,
            version: this.version,
            packageManager,
        })
        
    }
}