import React, { useState } from 'react';
import { Layout } from '../components';
import { RuleForm } from '../components/form';
import { EuiButton, EuiButtonEmpty, EuiLink } from '@elastic/eui';
import { FileEditor } from '../../../common/assets';

export const EditRule = props => {
  const [view, setView] = useState('visual-editor');

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
    ...(view === 'visual-editor'
      ? [
          <EuiButtonEmpty
            fill
            onClick={() => {
              setView('file-editor');
            }}
            iconType='apmTrace'
          >
            Switch to file editor
          </EuiButtonEmpty>,
        ]
      : [
          <EuiButtonEmpty
            fill
            onClick={() => {
              setView('visual-editor');
            }}
            iconType='apmTrace'
          >
            Switch to visual editor
          </EuiButtonEmpty>,
        ]),
  ];

  return (
    <Layout title='Edit rule' actions={actions}>
      {view === 'visual-editor' && <RuleForm {...props} />}
      {view === 'file-editor' && <FileEditor {...props} isEditable={true} />}
    </Layout>
  );
};
