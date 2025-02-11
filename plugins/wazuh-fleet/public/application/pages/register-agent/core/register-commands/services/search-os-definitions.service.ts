import {
  DuplicatedOSException,
  DuplicatedOSOptionException,
  NoOSOptionFoundException,
  NoOptionFoundException,
} from '../exceptions';
import { IOSDefinition, IOperationSystem } from '../types';

/**
 * Searches for the OS definition option that matches the given operation system parameters.
 * Throws an exception if no matching option is found.
 *
 * @param osDefinitions - The list of OS definitions to search through.
 * @param params - The operation system parameters to match against.
 * @returns The matching OS definition option.
 * @throws NoOSOptionFoundException - If no matching OS definition is found.
 */
export function searchOSDefinitions<
  OS extends IOperationSystem,
  Params extends string,
>(osDefinitions: IOSDefinition<OS, Params>[], params: IOperationSystem) {
  const { name, architecture } = params;
  const osDefinition = osDefinitions.find(os => os.name === name);

  if (!osDefinition) {
    throw new NoOSOptionFoundException(name);
  }

  const osDefinitionOption = osDefinition.options.find(
    option => option.architecture === architecture,
  );

  if (!osDefinitionOption) {
    throw new NoOptionFoundException(name, architecture);
  }

  return osDefinitionOption;
}

/**
 * Validates that there are no duplicated OS definitions in the given list.
 * Throws an exception if a duplicated OS definition is found.
 *
 * @param osDefinitions - The list of OS definitions to validate.
 * @throws DuplicatedOSException - If a duplicated OS definition is found.
 */
export function validateOSDefinitionsDuplicated<
  OS extends IOperationSystem,
  Params extends string,
>(osDefinitions: IOSDefinition<OS, Params>[]) {
  const osNames = new Set<string>();

  for (const osDefinition of osDefinitions) {
    if (osNames.has(osDefinition.name)) {
      throw new DuplicatedOSException(osDefinition.name);
    }

    osNames.add(osDefinition.name);
  }
}

/**
 * Validates that there are no duplicated OS definition options in the given list.
 * Throws an exception if a duplicated OS definition option is found.
 *
 * @param osDefinitions - The list of OS definitions to validate.
 * @throws DuplicatedOSOptionException - If a duplicated OS definition option is found.
 */
export function validateOSDefinitionHasDuplicatedOptions<
  OS extends IOperationSystem,
  Params extends string,
>(osDefinitions: IOSDefinition<OS, Params>[]) {
  for (const osDefinition of osDefinitions) {
    const options = new Set<string>();

    for (const option of osDefinition.options) {
      const managerArchitecture = `${option.architecture}`;

      if (options.has(managerArchitecture)) {
        throw new DuplicatedOSOptionException(
          osDefinition.name,
          option.architecture,
        );
      }

      options.add(managerArchitecture);
    }
  }
}
