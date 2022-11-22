import React from 'react';
import { StepButtonGroup } from '../components';
import { iButton } from '../config';

export interface iButtonContent {
  buttons: iButton[];
  title: string;
  defaultValue: any;
  onChange: (value: string) => void;
  afterContent?: () => JSX.Element;
}


/**
 * Return the children component from config selected
 */
export const renderGroupBtnsContent = ({
  buttons,
  afterContent,
  title,
  defaultValue,
  onChange,
}: iButtonContent) => {
  return (
    <>
      <StepButtonGroup
        buttons={buttons}
        legend={title}
        defaultValue={defaultValue}
        onChange={onChange}
      />
      {afterContent && afterContent}
    </>
  );
};

export interface iStep {
  title: string;
  children: (
    title: string,
    state: any,
    onChange: (key: string, value: string) => void,
  ) => any;
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
            children: stepContent,
          };
    })
    .filter(step => step);
};
