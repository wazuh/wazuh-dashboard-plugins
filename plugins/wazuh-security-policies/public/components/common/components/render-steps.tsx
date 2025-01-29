import React from 'react';
import {
  EuiPanel,
  EuiAccordion,
  EuiHorizontalRule,
  EuiForm,
} from '@elastic/eui';
import { capitalizeFirstLetter } from '../../utils/capitalize-first-letter';
import { renderInputs } from '../../utils/inputs/render-inputs';
import { STEPS } from '../constants';
import './render-steps.scss';

export const renderStepPanel = step => {
  const isArrayOfObjects =
    Array.isArray(step.value) && typeof step.value[0] === 'object';

  const renderCardTitle = (stepName: string, item: any) => {
    switch (true) {
      case stepName === STEPS.metadata: {
        return `${capitalizeFirstLetter(stepName)} of ${item.value.title}, from ${item.value.module}`;
      }

      case stepName === STEPS.check: {
        if (typeof item.value === 'string') {
          return `${capitalizeFirstLetter(stepName)}: ${item.value}`;
        }

        return `${capitalizeFirstLetter(stepName)} fields: ${item.value.map((obj: any) => Object.keys(obj)[0]).join(', ')}`;
      }

      case stepName.startsWith(STEPS.parse): {
        return stepName.split('|')[1];
      }

      case stepName === STEPS.normalize: {
        // Item is the only step in this case as you can have several normalize steps.
        return `${capitalizeFirstLetter(stepName)} fields:
        ${Object.keys(item).join(', ')}`;
      }

      case stepName === STEPS.allow: {
        return capitalizeFirstLetter(stepName);
      }

      case stepName === STEPS.output: {
        return capitalizeFirstLetter(stepName);
      }

      case stepName === STEPS.definitions: {
        return capitalizeFirstLetter(stepName);
      }

      default: {
        return capitalizeFirstLetter(stepName);
      }
    }
  };

  if (isArrayOfObjects) {
    return step.value.map((item, index) => (
      <EuiPanel key={`${step.key}-${index}`} className='multiple-panels-step'>
        <EuiAccordion
          id={`accordion-${index}`}
          paddingSize='s'
          buttonContent={renderCardTitle(step.key, step.value[index])}
        >
          <EuiHorizontalRule margin='s' />
          <EuiForm component='form'>
            {renderInputs({
              key: step.key,
              value: item,
              handleSetItem: step.handleSetItem,
              keyValue: step.keyValue ?? '',
            })}
          </EuiForm>
        </EuiAccordion>
      </EuiPanel>
    ));
  }

  return (
    <EuiPanel>
      <EuiAccordion
        id='accordion1'
        paddingSize='s'
        buttonContent={renderCardTitle(step.key, step)}
      >
        <EuiHorizontalRule margin='s' />

        <EuiForm component='form'>{renderInputs(step)}</EuiForm>
      </EuiAccordion>
    </EuiPanel>
  );
};
