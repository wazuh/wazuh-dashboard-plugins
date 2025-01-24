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
} from '@elastic/eui';
import { useParams } from 'react-router-dom';
import { renderInputs } from '../common/render-inputs';
import { capitalizeFirstLetter } from '../utils/capitalize-first-letter';
import { decoder } from './mock-data-rules';

const possibleSteps = {
  metadata: 'metadata',
  check: 'check',
  parse: 'parse|',
  normalize: 'normalize',
  allow: 'allow',
  output: 'output',
  definitions: 'definitions',
};

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

  const renderCardTitle = (stepName: string, item: any) => {
    switch (true) {
      case stepName === possibleSteps.metadata: {
        return `${capitalizeFirstLetter(stepName)} of ${item.value.title}, from ${item.value.module}`;
      }

      case stepName === possibleSteps.check: {
        if (typeof item.value === 'string') {
          return `${capitalizeFirstLetter(stepName)}: ${item.value}`;
        }

        return `${capitalizeFirstLetter(stepName)} fields: ${item.value.map((obj: any) => Object.keys(obj)[0]).join(', ')}`;
      }

      case stepName.startsWith(possibleSteps.parse): {
        return stepName.split('|')[1];
      }

      case stepName === possibleSteps.normalize: {
        return `${capitalizeFirstLetter(stepName)} fields: `;
        // ${item.value.map(
        //   (obj: any) =>
        //     Object.values(
        //       obj.map.map((subObj: any) => Object.keys(subObj)[0]),
        //     ).join(', '),
        // )}`;
      }

      case stepName === possibleSteps.allow: {
        return capitalizeFirstLetter(stepName);
      }

      case stepName === possibleSteps.output: {
        return capitalizeFirstLetter(stepName);
      }

      case stepName === possibleSteps.definitions: {
        return capitalizeFirstLetter(stepName);
      }

      default: {
        return capitalizeFirstLetter(stepName);
      }
    }
  };

  const renderTitleStep = (stepName: string) => {
    let title = stepName;

    if (stepName.startsWith(possibleSteps.parse)) {
      title = stepName.split('|')[0];
    }

    return capitalizeFirstLetter(title);
  };

  const step = (item: any) => {
    const removeEntries = new Set(['id', 'name', 'provider', 'status']);
    const arraySteps = Object.entries(item)
      .filter(([key]) => !removeEntries.has(key))
      .map(([key, value]) => ({
        key,
        value,
      }));
    const steps = arraySteps.map(step => ({
      title: renderTitleStep(step.key),
      children: (
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
