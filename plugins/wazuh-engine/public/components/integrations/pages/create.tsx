import React from 'react';
import { Layout } from '../components';
import { Form } from '../components/form';
import { EuiLink } from '@elastic/eui';

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
  ];

  return (
    <Layout title='Create integration' actions={actions}>
      <Form {...props} />
    </Layout>
  );
};
