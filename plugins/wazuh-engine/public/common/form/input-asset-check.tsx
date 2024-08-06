import React from 'react';
import {
  EuiButton,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
} from '@elastic/eui';

export const InputAssetCheck = props => {
  const { useForm, InputForm } = props;

  const { fields } = useForm({
    mode: {
      type: 'select',
      initialValue: 'text',
      options: {
        select: [
          {
            text: 'text',
            value: 'text',
          },
          {
            text: 'list',
            value: 'list',
          },
        ],
      },
    },
    mode_text_content: {
      type: 'textarea',
      initialValue: '',
      placeholder: 'Test',
    },
    // property:value
    mode_list_content: {
      type: 'arrayOf',
      initialValue: [
        {
          field: '',
          value: '',
        },
      ],
      fields: {
        field: {
          type: 'text',
          initialValue: '',
        },
        value: {
          type: 'text',
          initialValue: '',
        },
      },
    },
  });
  return (
    <>
      <InputForm {...fields.mode} label='mode' />
      <EuiSpacer />
      {fields.mode.value === 'text' ? (
        <InputForm {...fields.mode_text_content} />
      ) : (
        <>
          {fields.mode_list_content.fields.map((field, index) => (
            <>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <InputForm {...field.field} label={`Field ${index}`} />
                </EuiFlexItem>
                <EuiFlexItem>
                  <InputForm {...field.value} label={`Value ${index}`} />
                </EuiFlexItem>
                <EuiFlexItem grow={false} style={{ alignSelf: 'center' }}>
                  <EuiButtonIcon
                    display='base'
                    color='danger'
                    iconType='cross'
                    onClick={() => fields.mode_list_content.removeItem(index)}
                  ></EuiButtonIcon>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer />
            </>
          ))}
          <EuiButton onClick={fields.mode_list_content.addNewItem}>
            Add
          </EuiButton>
          <EuiSpacer />
        </>
      )}
    </>
  );
};
