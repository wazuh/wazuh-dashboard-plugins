import React from 'react';
import { Layout } from '../components';
import { RuleForm } from '../components/form';
import { EuiButton, EuiLink } from '@elastic/eui';

export const Create = props => {
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
    <Layout title='Create integration' actions={actions}>
      <RuleForm {...props} />
    </Layout>
  );
};
