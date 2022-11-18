import React, { useState } from 'react';
import { StepButtonGroup } from '../components';
import { buttonsConfig, iButton, VersionBtn } from '../config/new-config';


export interface iButtonContent {
  buttons: iButton[];
  title: string;
  defaultValue: any,
  onChange: (value: string) => void,
  afterContent?: () => JSX.Element;
}

/**
 * Return the children component from config selected
 */
export const renderContent = ({ buttons, afterContent, title, defaultValue, onChange} : iButtonContent) => {

  return (
    <>
      <StepButtonGroup buttons={buttons} legend={title} defaultValue={defaultValue} onChange={onChange}/>
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
export const getOSStepContent = (title: string, state: any, onChange: (field: string, value: string) => void) => {
  const buttons = buttonsConfig.map(button => ({
    id: button.id,
    label: button.label,
  }));

  const handleOnchange = (value: string) => {
    onChange('os', value);
  }

  return {
    title,
    buttons,
    defaultValue: state.os,
    onChange: handleOnchange,
  }
};



/**
 *
 * @param OS
 * @param version
 * @param architecture
 */
export const getVersionStepContent = (title: string, state: any, onChange: (field: string, value: string) => void) => {
  const { os, version } = state;
  if (!os) {
    // hide step
    return false;
  }

  const handleOnchange = (value: string) => {
    onChange('version', value);
  }

  const buttons = buttonsConfig.find(button => button.id === os)?.versionsBtns;
  if(!buttons) {
    console.error('No buttons found for OS', os);
    return false;
  }

  const versionBtn = buttons?.filter(
    button => button.id === version,
  ) as VersionBtn[];
  if (versionBtn?.length && versionBtn[0].afterContent) {
    return {
      title,
      buttons,
      afterContent: versionBtn[0].afterContent,
      defaultValue: state.version,
      onChange: handleOnchange,
    };
  } else {
    return {
      title,
      buttons,
      defaultValue: state.version,
      onChange: handleOnchange
    };
  }
};

/**
 *
 * @param OS
 * @param version
 * @param architecture
 */
export const getArchitectureStepContent = (title: string, state: any, onChange: (field: string, value: string) => void) => {
  const { os, version } = state;
  
  if (!version) {
    // hide step
    return false;
  }

  const handleOnchange = (value: string) => {
    onChange('architecture', value);
  }

  const buttons = buttonsConfig.find(button => button.id === os)?.architectureBtns;
  return {
    title,
    buttons,
    defaultValue: state.architecture,
    onChange: handleOnchange,
  }
};

export interface iStep {
  title: string;
  children: (os: string, version: string, architecture: string) => any;
}


/**
 *
 * @param OSSelected
 * @param OSVersionSelected
 * @param OSArchSelected
 */
export const getDeployAgentSteps = (
  stepsBtnsDefinitions: iStep[],
  state: any,
  onChangeState: (key: string, value: string) => void,
) => {
  return stepsBtnsDefinitions
    .map((step: iStep) => {
      const { title, children } = step;
      const stepContent =
      typeof children === 'function'
      ? children(title, state, onChangeState)
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
