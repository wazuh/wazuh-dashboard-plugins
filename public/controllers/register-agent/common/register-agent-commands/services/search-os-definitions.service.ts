import { NoOSOptionFoundException, NoOptionFoundException } from "../exceptions";
import { IDefinitionsInput } from "../types";

export const searchOSDefinitions = (inputs: IDefinitionsInput) => {
    const { osDefinitions, osName, architecture, extension, packageManager } = inputs;

    const osDefinition = osDefinitions.find(os => os.name === osName);
    if (!osDefinition) {
        throw new NoOSOptionFoundException(osName);
    }

    const osDefinitionOption = osDefinition.options.find(
        option =>
            option.architecture === architecture &&
            option.extension === extension &&
            option.packageManager === packageManager,
    );

    if (!osDefinitionOption) {
        throw new NoOptionFoundException(osName, architecture, extension);
    }

    return osDefinitionOption;
}