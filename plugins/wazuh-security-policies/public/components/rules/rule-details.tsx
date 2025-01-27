import React from 'react';
import {
  EuiPageHeader,
  EuiButton,
  EuiButtonEmpty,
  EuiText,
  EuiButtonIcon,
  EuiSteps,
} from '@elastic/eui';
import { useParams } from 'react-router-dom';
import { renderStepPanel } from '../common/render-steps';
import { capitalizeFirstLetter } from '../utils/capitalize-first-letter';
import { STEPS } from '../common/constants';
import { decoder } from './mock-data-rules';
import './rule-details.scss';

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
      key='test-item'
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

  const renderTitleStep = (stepName: string) => {
    let title = stepName;

    if (stepName.startsWith(STEPS.parse)) {
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
      children: renderStepPanel(step),
    }));

    return steps;
  };

  return (
    <>
      <EuiPageHeader
        pageTitle={title}
        bottomBorder={true}
        alignItems='center'
        rightSideGroupProps={{
          alignItems: 'center',
        }}
        rightSideItems={buttons}
      />
      <EuiSteps className='steps-details' steps={step(item)} />
    </>
  );
};
