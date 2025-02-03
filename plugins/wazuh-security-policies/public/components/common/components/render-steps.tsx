import React from 'react';
import {
  EuiPanel,
  EuiAccordion,
  EuiHorizontalRule,
  EuiForm,
  EuiButton,
} from '@elastic/eui';
import { capitalizeFirstLetter } from '../../utils/capitalize-first-letter';
import { renderInputs } from '../../utils/inputs/render-inputs';
import { STEPS } from '../constants';
import './render-steps.scss';
import { isEditable } from '../../utils/is-editable';
import { RenderCheckStep } from './steps/render-check-step';
import { RenderNormalizeStep } from './steps/render-normalize-step';
import { RenderParseStep } from './steps/render-parse-step';
import { ParseNameInput } from './steps/parse-name-input';

export const renderStepPanel = step => {
  const editable = isEditable();
  let panelToRender: React.ReactNode;

  const renderCardTitle = (stepName: string, item: any) => {
    switch (true) {
      case stepName === STEPS.metadata: {
        return `${capitalizeFirstLetter(stepName)} of ${item.value.title}, from ${item.value.module}`;
      }

      case stepName === STEPS.check: {
        panelToRender = <RenderCheckStep step={step} />;

        if (typeof item.value === 'string') {
          return `${capitalizeFirstLetter(stepName)}: ${item.value}`;
        }

        return `${capitalizeFirstLetter(stepName)} fields: `;
        // ${item.value.map((obj: any) => Object.keys(obj)[0]).join(', ')}`;
      }

      case stepName.startsWith(STEPS.parse): {
        panelToRender = <RenderParseStep step={step} />;

        return stepName.split('|')[1];
      }

      case stepName === STEPS.normalize: {
        // Item is the only step in this case as you can have several normalize steps.
        panelToRender = <RenderNormalizeStep step={step} />;

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

  const stepsDiferentRender = [
    STEPS.check,
    STEPS.parse,
    STEPS.normalize,
    STEPS.definitions,
  ];

  if (step.key === STEPS.normalize) {
    return (
      <>
        {step.value.map((item, index) => (
          <EuiPanel
            key={`${step.key}-${index}`}
            className='multiple-panels-step'
          >
            <EuiAccordion
              id={`accordion-${index}`}
              paddingSize='s'
              buttonContent={renderCardTitle(step.key, step.value[index])}
            >
              <EuiHorizontalRule margin='s' />
              <EuiForm component='form'>
                {editable
                  ? panelToRender
                  : renderInputs({
                      key: step.key,
                      value: item,
                      handleSetItem: step.handleSetItem,
                      keyValue: step.keyValue ?? '',
                    })}
              </EuiForm>
            </EuiAccordion>
          </EuiPanel>
        ))}
        <EuiButton
          size='s'
          onClick={() =>
            step.handleSetItem({ key: step.key, newValue: [...step.value, {}] })
          }
        >
          Add new
        </EuiButton>
      </>
    );
  }

  return (
    <EuiPanel>
      {step.key === STEPS.parse ? (
        <ParseNameInput step={step} />
      ) : (
        <EuiAccordion
          id='accordion1'
          paddingSize='s'
          buttonContent={renderCardTitle(step.key, step)}
        >
          <EuiHorizontalRule margin='s' />

          <EuiForm component='form'>
            {editable && stepsDiferentRender.includes(step.key)
              ? panelToRender
              : renderInputs(step)}
          </EuiForm>
        </EuiAccordion>
      )}
    </EuiPanel>
  );
};
