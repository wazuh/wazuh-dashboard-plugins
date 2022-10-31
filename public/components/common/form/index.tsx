import React from 'react';
import { InputFormEditor } from './input_editor';
import { InputFormNumber } from './input_number';
import { InputFormText } from './input_text';
import { InputFormSelect } from './input_select';
import { InputFormSwitch } from './input_switch';
import { InputFormFilePicker } from './input_filepicker';
import { InputFormTextArea } from './input_text_area';
import { EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';

export const InputForm = ({
  type,
  value,
  onChange,
  error,
  label,
  header,
  footer,
  preInput,
  postInput,
...rest}) => {

  const ComponentInput = Input[type];

  if(!ComponentInput){
    return null;
  };

  const isInvalid = Boolean(error);

  const input = (
    <ComponentInput
      {...rest}
      value={value}
      onChange={onChange}
      isInvalid={isInvalid}
    />
  );

  return label
    ? (
      <EuiFormRow label={label} fullWidth isInvalid={isInvalid} error={error}>
        <>
          {typeof header === 'function' ? header({value, error}) : header}
          <EuiFlexGroup responsive={false}>
            {typeof preInput === 'function' ? preInput({value, error}) : preInput}
            <EuiFlexItem>
              {input}
            </EuiFlexItem>
            {typeof postInput === 'function' ? postInput({value, error}) : postInput}
          </EuiFlexGroup>
          {typeof footer === 'function' ? footer({value, error}) : footer}
        </>
      </EuiFormRow>)
    : input;

};

const Input = {
  switch: InputFormSwitch,
  editor: InputFormEditor,
  filepicker: InputFormFilePicker,
  number: InputFormNumber,
  select: InputFormSelect,
  text: InputFormText,
  textarea: InputFormTextArea,
};
