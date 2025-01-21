import React from 'react';
import {
  EuiPageHeader,
  EuiButton,
  EuiButtonEmpty,
  EuiText,
  EuiButtonIcon,
} from '@elastic/eui';
import { useParams } from 'react-router-dom';
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
    </>
  );
};
