import {
  DuplicatedOSException,
  DuplicatedOSOptionException,
  NoOSOptionFoundException,
  NoOptionFoundException,
} from '../exceptions';
import { IOSDefinition, IOperationSystem } from '../types';

export const searchOSDefinitions = (
  osDefinitions: IOSDefinition[],
  params: IOperationSystem,
) => {
  const { name, architecture, extension } = params;

  const osDefinition = osDefinitions.find(os => os.name === name);
  if (!osDefinition) {
    throw new NoOSOptionFoundException(name);
  }

  const osDefinitionOption = osDefinition.options.find(
    option =>
      option.architecture === architecture && option.extension === extension,
  );

  if (!osDefinitionOption) {
    throw new NoOptionFoundException(name, architecture, extension);
  }

  return osDefinitionOption;
};

export const validateOSDefinitionsDuplicated = (
  osDefinitions: IOSDefinition[],
) => {
  const osNames = new Set<string>();

  for (const osDefinition of osDefinitions) {
    if (osNames.has(osDefinition.name)) {
      throw new DuplicatedOSException(osDefinition.name);
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
      let ext_arch_manager = `${option.extension}_${option.architecture}`;
      if (options.has(ext_arch_manager)) {
        throw new DuplicatedOSOptionException(
          osDefinition.name,
          option.extension,
          option.architecture,
        );
      }
      options.add(ext_arch_manager);
    }
  }
};
