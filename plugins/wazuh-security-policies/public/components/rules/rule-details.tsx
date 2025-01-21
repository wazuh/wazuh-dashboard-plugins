import React from 'react';
import {
  EuiPageHeader,
  EuiButton,
  EuiButtonEmpty,
  EuiText,
  EuiButtonIcon,
  EuiSteps,
  EuiPanel,
  EuiAccordion,
  EuiHorizontalRule,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
} from '@elastic/eui';
import { useParams } from 'react-router-dom';
import { renderInputs } from '../common/render-inputs';
import { decoder } from './mock-data-rules';

export const RuleDetails = () => {
  const { id: name } = useParams();
  const item = decoder.find(item => item.name === decodeURIComponent(name));
  const title = (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <EuiText style={{ marginRight: '10px' }}>{item?.name}</EuiText>
      <EuiButtonIcon
        color={'text'}
        onClick={() => {}}
        iconType='pencil'
        aria-label='Edit'
      />
    </div>
  );
  const buttons = [
    <EuiButton size='s' key='edit'>
      Edit
    </EuiButton>,
    <EuiButtonEmpty
      size='xs'
      key='test-decoder'
      color='primary'
      onClick={() => {}}
    >
      Test decoder
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      size='xs'
      key='status-item'
      color='primary'
      onClick={() => {}}
      style={{ textTransform: 'capitalize' }}
    >
      {item?.status}
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      key='view-in-xml'
      size='xs'
      color='primary'
      onClick={() => {}}
    >
      View in XML
    </EuiButtonEmpty>,
  ];

  const step = item => {
    const removeEntries = new Set(['id', 'name', 'provider', 'status']);
    const arraySteps = Object.entries(item)
      .filter(([key]) => !removeEntries.has(key))
      .map(([key, value]) => ({
        key,
        value,
      }));
    const steps = arraySteps.map(step => ({
      title: 'Better step',
      children: (
        <EuiPanel>
          <EuiAccordion
            id='accordion1'
            paddingSize='s'
            buttonContent={step.key}
          >
            <EuiHorizontalRule margin='s' />

            <EuiForm component='form'>
              {Object.entries(step.value)
                .map(([key, value]) => ({ key, value }))
                .map((item, index) => {
                  if (Array.isArray(item.value)) {
                    return renderInputs(item.value);
                  }

                  if (typeof item.value !== 'string') {
                    return null;
                  }

                  return (
                    <EuiFormRow
                      key={`${item.key}-${index}`}
                      label={item.key}
                      fullWidth
                      display='columnCompressed'
                    >
                      <EuiFieldText
                        value={item.value}
                        name='username'
                        fullWidth
                        compressed
                        readOnly
                      />
                    </EuiFormRow>
                  );
                })}
            </EuiForm>
          </EuiAccordion>
        </EuiPanel>
      ),
    }));

    return steps;
  };

  return (
    <>
      <EuiPageHeader
        pageTitle={title}
        bottomBorder='true'
        alignItems='center'
        rightSideGroupProps={{
          alignItems: 'center',
        }}
        rightSideItems={buttons}
      />
      <EuiSteps steps={step(item)} />
    </>
  );
};
