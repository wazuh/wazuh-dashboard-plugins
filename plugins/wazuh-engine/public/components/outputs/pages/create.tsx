import React from 'react';
import { Layout } from '../components';
import { Form } from '../components/form';
import { EuiButton, EuiLink } from '@elastic/eui';
import { FileEditor } from '../../../common/assets';

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
      <Form {...props} />
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
      <FileEditor {...props} isEditable={true} />
    </Layout>
  );
};
