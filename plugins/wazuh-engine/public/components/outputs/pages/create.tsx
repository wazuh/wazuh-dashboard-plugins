import React, { useState } from 'react';
import { Layout } from '../components';
import { RuleForm } from '../components/form';
import { EuiButton, EuiButtonEmpty, EuiLink } from '@elastic/eui';
import { RuleFileEditor } from '../components/file-editor';

export const CreateVisual = props => {
  const actions = [
    <EuiLink
      href={'#'} // TODO: change link to documentation
      target='_blank'
      external
      style={{ textAlign: 'center' }}
      rel='noopener noreferrer'
    >
      Documentation
    </EuiLink>,
    <EuiButton
      onClick={() => {
        // TODO: Implement
      }}
      iconType='importAction'
    >
      Import file
    </EuiButton>,
  ];

  return (
    <Layout title='Create output' actions={actions}>
      <RuleForm {...props} />
    </Layout>
  );
};

export const CreateFile = props => {
  const actions = [
    <EuiLink
      href={'#'} // TODO: change link to documentation
      target='_blank'
      external
      style={{ textAlign: 'center' }}
      rel='noopener noreferrer'
    >
      Documentation
    </EuiLink>,
    <EuiButton
      onClick={() => {
        // TODO: Implement
      }}
      iconType='importAction'
    >
      Import file
    </EuiButton>,
  ];

  return (
    <Layout title='Create output' actions={actions}>
      <RuleFileEditor {...props} isEditable={true} />
    </Layout>
  );
};
