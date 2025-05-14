import React, { useState, useRef } from 'react';
import { EuiRadioGroup, EuiButton } from '@elastic/eui';
import { inputString } from '../../../utils/inputs/string-inputs';
import { TableForm } from '../table-form';

interface RenderCheckStepProps {
  step: {
    key: string;
    value: any;
    handleSetItem: (props: { key: string; newValue: any }) => void;
  };
}

export const RenderCheckStep = (props: RenderCheckStepProps) => {
  const { step } = props;
  const instanceId = useRef(
    `${step.key}-${Math.random().toString(36).slice(2, 11)}`,
  );
  const [isString, setIsString] = useState(
    typeof step.value === 'string' ? 'string' : 'array',
  );
  const [valueString, setValueString] = useState(
    typeof step.value === 'string' ? step.value : '',
  );

  const handleStringItem = ({ newValue }: { newValue: string }) => {
    setValueString(newValue);
  };

  const handleSaveButton = () => {
    step.handleSetItem({
      key: step.key,
      newValue: valueString,
    });
  };

  return (
    <>
      <EuiRadioGroup
        options={[
          {
            id: `string-${instanceId.current}`,
            label: 'One',
          },
          {
            id: `array-${instanceId.current}`,
            label: 'More than one',
          },
        ]}
        idSelected={`${isString}-${instanceId.current}`}
        onChange={(id: string) => {
          setIsString(id.split('-')[0]);
        }}
        name={`radio-group-${instanceId.current}`}
        legend={{
          children: <span>One or more</span>,
        }}
      />
      {isString === 'string' && (
        <>
          {inputString(
            { ...step, value: valueString, handleSetItem: handleStringItem },
            true,
          )}
          <EuiButton
            size='s'
            onClick={() => {
              handleSaveButton();
            }}
            disabled={valueString === ''}
          >
            Save
          </EuiButton>
        </>
      )}
      {isString === 'array' && (
        <TableForm handleSetItem={step.handleSetItem} parentKey={step.key} />
      )}
    </>
  );
};
