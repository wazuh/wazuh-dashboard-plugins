import React, { useState } from 'react';
import {
  EuiPanel,
  EuiAccordion,
  EuiHorizontalRule,
  EuiForm,
  EuiButton,
  EuiButtonEmpty,
} from '@elastic/eui';
import { cloneDeep } from 'lodash';
import { capitalizeFirstLetter } from '../../utils/capitalize-first-letter';
import { renderInputs } from '../../utils/inputs/render-inputs';
import { STEPS } from '../constants';
import './render-steps.scss';
import { isEditable } from '../../utils/is-editable';
import { metadataInitialValues } from '../../rules/schemas/metadata.schema';
import { RenderCheckStep } from './steps/render-check-step';
import { RenderNormalizeStep } from './steps/render-normalize-step';
import { RenderParseStep } from './steps/render-parse-step';
import { PopoverIconButton } from './popover';

interface StepsProps {
  step: {
    key: string;
    value: any;
    handleSetItem: (props: { key: string; newValue: any }) => void;
    keyValue?: string;
  };
}

export const RenderStepPanel = ({ step }: StepsProps) => {
  const editable = isEditable();
  const [onXml, setOnXml] = useState(false);
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

        if (!stepName.includes('|')) {
          return 'Parse';
        }

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

  const buttonsPopover = [
    {
      id: `editOnFormOrXMLStep-${step.key}`,
      label: onXml ? 'Edit on form' : 'Edit on XML',
      color: 'text',
      onClick: () => setOnXml(!onXml),
    },
    {
      id: `duplicateItem-${step.key}`,
      label: `Duplicate ${step.key}`,
      color: 'text',
      onClick: () => {},
    },
    {
      id: `clear-${step.key}`,
      label: 'Clear',
      color: 'text',
      onClick: () => {
        step.handleSetItem({
          newValue: cloneDeep(metadataInitialValues[step.key]),
          key: step.key,
        });
      },
    },
  ];
  const popover = (
    <PopoverIconButton>
      <div>
        {buttonsPopover.map((button, index) => (
          <span key={button.id}>
            <EuiButtonEmpty
              size='s'
              color={button.color}
              onClick={button.onClick}
            >
              {button.label}
            </EuiButtonEmpty>
            {index < buttonsPopover.length - 1 && (
              <EuiHorizontalRule margin='none' />
            )}
          </span>
        ))}
      </div>
    </PopoverIconButton>
  );

  return (
    <EuiPanel>
      <EuiAccordion
        id='accordion1'
        paddingSize='s'
        buttonContent={renderCardTitle(step.key, step)}
        extraAction={popover}
      >
        <EuiHorizontalRule margin='s' />

        <EuiForm component='form'>
          {editable && stepsDiferentRender.includes(step.key)
            ? panelToRender
            : renderInputs(step)}
        </EuiForm>
      </EuiAccordion>
    </EuiPanel>
  );
};
