import React from 'react';
import { EuiButtonGroup } from '@elastic/eui';
import { buttonsConfig, iButton, VersionBtn } from '../config/new-config';

const renderButtonGroup = (
  buttons: iButton[],
  legend: string,
  defaultValue: string,
  onChange: (id: string) => void,
) => {
  return (
    <EuiButtonGroup
      color='primary'
      legend={legend}
      options={buttons}
      idSelected={defaultValue}
      onChange={onChange}
      className={'osButtonsStyle'}
    />
  );
};
export interface iButtonContent {
  buttons: iButton[];
  afterContent?: () => JSX.Element;
}

/**
 * Return the children component from config selected
 */
export const renderContent = ({ buttons, afterContent } : iButtonContent) => {
  return (
    <>
      {renderButtonGroup(buttons, 'OS', 'linux', () => {})}
      {afterContent && afterContent}
    </>
  );
};


/**
 *
 * @param OS
 * @param version
 * @param architecture
 */
export const getOSStepContent = (
  OS: string,
  version: string,
  architecture: string,
) => {
  const buttons = buttonsConfig.map(button => ({
    id: button.id,
    label: button.label,
  }));
  return {
    buttons
  }
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
) : iButtonContent | false => {
  if (!OS) {
    // hide step
    return false;
  }
  const buttons = buttonsConfig.find(button => button.id === OS)?.versionsBtns;
  if(!buttons) {
    console.error('No buttons found for OS', OS);
    return false;
  }

  const versionBtn = buttons?.filter(
    button => button.id === version,
  ) as VersionBtn[];
  if (versionBtn?.length && versionBtn[0].afterContent) {
    return {
      buttons,
      afterContent: versionBtn[0].afterContent,
    };
  } else {
    return {
      buttons,
    };
  }
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
  const buttons = buttonsConfig.find(button => button.id === OS)?.architectureBtns;
  return {
    buttons
  }
};

interface iStep {
  title: string;
  children: (os: string, version: string, architecture: string) => any;
}

const stepsBtnsDefinitions: iStep[] = [
  {
    title: 'Choose the operating system',
    children: getOSStepContent,
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
  return stepsBtnsDefinitions
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
            children: renderContent({ ...stepContent } as iButtonContent),
          };
    })
    .filter(step => step);
};
