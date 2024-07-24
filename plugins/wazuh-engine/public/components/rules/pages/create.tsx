import React from 'react';
import { Layout } from '../components';
import { RuleForm } from '../components/form';
import { EuiButton, EuiLink } from '@elastic/eui';
import { RuleFileEditor } from '../components/file-editor';

export const CreateRuleVisual = props => {
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
    <Layout title='Create rule' actions={actions}>
      <RuleForm {...props} />
    </Layout>
  );
};

export const CreateRuleFile = props => {
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
    <Layout title='Create rule' actions={actions}>
      <RuleFileEditor {...props} isEditable={true} />
    </Layout>
  );
};
