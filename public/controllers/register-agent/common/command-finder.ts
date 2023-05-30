import { searchOSDefinitions } from "./register-agent-commands/services/search-os-definitions.service";
import { ICommandConstructorInput, IDefinitionsInput, IOSCommandsDefinition, IOSDefinition } from "./register-agent-commands/types";
import { ICommandCreator, ICommandFinder, IOSInputs } from "./types";

export class CommandFinder implements ICommandFinder {
    constructor(private osDefinitions: IOSDefinition[], private version: string) {
    
    }

    getOSDefinition(input: IDefinitionsInput){
        return searchOSDefinitions(this.osDefinitions, input); 
    } 
    
    getInstallCommand(params: IOSInputs) {
        const osConfig = this.getOSDefinition(params);
        const urlPackage = osConfig.urlPackage({
            version: this.version,
            architecture: params.architecture,
            extension: params.extension,
        })
        return osConfig.installCommand({
            ...osConfig,
            urlPackage,
            version: this.version,
        });
    }

    getStartCommand(params: IOSInputs) {
        const osConfig = this.getOSDefinition(params);
        return osConfig.startCommand({
            extension: params.extension,
            architecture: params.architecture,
            version: this.version,
        })
    }
}




