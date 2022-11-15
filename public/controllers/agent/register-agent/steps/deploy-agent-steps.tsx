import { buttonsConfig, iButton } from '../config';

/**
 *
 * @param OS
 * @param version
 * @param architecture
 */
export const getOSSteṕContent = (
  OS: string,
  version: string,
  architecture: string,
) => {
  return buttonsConfig.map((button: iButton) => ({
    id: button.id,
    label: button.label,
  }));
};

/**
 *
 * @param OS
 * @param version
 * @param architecture
 */
export const getVersionStepContent = (
  OS: string,
  version: string,
  architecture: string,
) => {
  if (!OS) {
    // hide step
    return false;
  }
  return buttonsConfig.find((button: iButton) => button.id === OS)
    ?.versionsBtns;
};

/**
 *
 * @param OS
 * @param version
 * @param architecture
 */
export const getArchitectureStepContent = (
  OS: string,
  version: string,
  architecture: string,
) => {
  if (!version) {
    // hide step
    return false;
  }

  return buttonsConfig.find((button: iButton) => button.id === OS)
    ?.architectureBtns;
};

const stepsDefinitions = [
  {
    title: 'Choose the operating system',
    children: getOSSteṕContent,
  },
  {
    title: 'Choose the version',
    children: getVersionStepContent,
  },
  {
    title: 'Choose the architecture',
    children: getArchitectureStepContent,
  },
];

/**
 *
 * @param OSSelected
 * @param OSVersionSelected
 * @param OSArchSelected
 */
export const getDeployAgentSteps = (
  OSSelected: string,
  OSVersionSelected: string,
  OSArchSelected: string,
) => {
  return stepsDefinitions
    .map(step => {
      const { title, children } = step;
      const stepContent =
        typeof children === 'function'
          ? children(OSSelected, OSVersionSelected, OSArchSelected)
          : children;
          
      return !stepContent
        ? false
        : {
            title,
            children: stepContent,
          };
    })
    .filter(step => step);
};
