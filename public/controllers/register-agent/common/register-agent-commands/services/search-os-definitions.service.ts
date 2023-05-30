import {
  NoOSOptionFoundException,
  NoOptionFoundException,
} from '../exceptions';
import { IDefinitionsInput, IOSDefinition } from '../types';

export const searchOSDefinitions = (osDefinitions: IOSDefinition[], params: IDefinitionsInput) => {
  const { osName, architecture, extension, packageManager } =
    params;

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
};

export const validateOSDefinitionsDuplicated = (
  osDefinitions: IOSDefinition[],
) => {
  const osNames = new Set<string>();

  for (const osDefinition of osDefinitions) {
    if (osNames.has(osDefinition.name)) {
      throw new Error(`Duplicate OS name found: ${osDefinition.name}`);
    }
    osNames.add(osDefinition.name);
  }
};

export const validateOSDefinitionHasDuplicatedOptions = (
  osDefinitions: IOSDefinition[],
) => {
  for (const osDefinition of osDefinitions) {
    const options = new Set<string>();
    for (const option of osDefinition.options) {
      let ext_arch_manager = `${option.extension}_${option.architecture}_${option.packageManager}`;
      if (options.has(ext_arch_manager)) {
        throw new Error(
          `Duplicate option found for OS ${osDefinition.name}: ${option}`,
        );
      }
      options.add(ext_arch_manager);
    }
  }
};