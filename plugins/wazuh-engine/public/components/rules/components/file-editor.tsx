import React from 'react';
import {
  EuiCodeEditor,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
} from '@elastic/eui';

export const RuleFileEditor = ({
  initialContent = '',
  isEditable = false,
  ...props
}) => {
  const { useForm, InputForm } = props;
  const { fields } = useForm({
    filename: { type: 'text', initialValue: '' },
    content: { type: 'text', initialValue: initialContent || '' },
  });

  return (
    <>
      <EuiFlexGroup alignItems='flexEnd'>
        <EuiFlexItem grow>
          <InputForm {...fields.filename} label={'Filename'} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          {isEditable && (
            <EuiButton fill onClick={() => {}}>
              Save
            </EuiButton>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <EuiCodeEditor
        theme='textmate'
        width='100%'
        height={`calc(100vh - 270px)`}
        {...fields.content}
        mode='xml'
        isReadOnly={!isEditable}
        wrapEnabled
        // setOptions={this.codeEditorOptions}
        aria-label='Code Editor'
      />
    </>
  );
};
