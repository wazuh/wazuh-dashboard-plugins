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
import { decoder } from '../../rules/mock-data-rules';
import { capitalizeFirstLetter } from '../../utils/capitalize-first-letter';
import { renderStepPanel } from '../components/render-steps';
import { STEPS } from '../constants';
import './details-template.scss';

export const DetailsTemplate = () => {
  // const { pathname } = useLocation();
  // const view = pathname.split('/')[1];
  const { id: name } = useParams();
  const item = decoder.find(item => item.name === decodeURIComponent(name));
  const title = (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <EuiText className='wz-mr-10'>{item?.name}</EuiText>
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
      className='wz-capitalize'
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
      <EuiSteps
        className='steps-details'
        status='complete'
        steps={step(item)}
      />
    </>
  );
};
