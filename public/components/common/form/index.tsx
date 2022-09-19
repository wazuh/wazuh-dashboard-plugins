import React from 'react';
import { IInputForm } from './types';
import { InputFormEditor } from './input_editor';
import { InputFormNumber } from './input_number';
import { InputFormText } from './input_text';
import { InputFormSwitch } from './input_switch';
import { InputFormSelect } from './input_select';

import {
	EuiFormRow,
} from '@elastic/eui';

export const InputForm = ({ type, value, onChange, error, label, preInput, postInput, ...rest}) => {

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
          {typeof preInput === 'function' ? preInput({value, error}) : preInput}
          {input}
          {typeof postInput === 'function' ? postInput({value, error}) : postInput}
        </>
      </EuiFormRow>)
    : input;    

};  

const Input = {
  switch: InputFormSwitch,
  editor: InputFormEditor,
  number: InputFormNumber,
  select: InputFormSelect,
  text: InputFormText,
};
