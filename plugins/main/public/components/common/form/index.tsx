import React from 'react';
import { InputFormEditor } from './input_editor';
import { InputFormNumber } from './input_number';
import { InputFormText } from './input_text';
import { InputFormSelect } from './input_select';
import { InputFormSwitch } from './input_switch';
import { InputFormFilePicker } from './input_filepicker';
import { InputFormTextArea } from './input_text_area';
import { EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';
import { SettingTypes } from './types';
import { InputFormPassword } from './input-password';

export interface InputFormProps {
  type: SettingTypes;
  value: any;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  label?: string | React.ReactNode;
  header?:
    | React.ReactNode
    | ((props: { value: any; error?: string }) => React.ReactNode);
  footer?:
    | React.ReactNode
    | ((props: { value: any; error?: string }) => React.ReactNode);
  preInput?:
    | React.ReactNode
    | ((props: { value: any; error?: string }) => React.ReactNode);
  postInput?:
    | React.ReactNode
    | ((props: { value: any; error?: string }) => React.ReactNode);
}

interface InputFormComponentProps extends InputFormProps {
  rest: any;
}

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
  ...rest
}: InputFormComponentProps) => {
  const ComponentInput = Input[
    type as keyof typeof Input
  ] as React.ComponentType<InputFormComponentProps & any>;

  if (!ComponentInput) {
    return null;
  }

  const isInvalid = Boolean(error);

  const input = (
    <ComponentInput
      {...rest}
      value={value}
      onChange={onChange}
      isInvalid={isInvalid}
    />
  );

  return label ? (
    <EuiFormRow label={label} fullWidth isInvalid={isInvalid} error={error}>
      <>
        {typeof header === 'function' ? header({ value, error }) : header}
        <EuiFlexGroup responsive={false}>
          {typeof preInput === 'function'
            ? preInput({ value, error })
            : preInput}
          <EuiFlexItem>{input}</EuiFlexItem>
          {typeof postInput === 'function'
            ? postInput({ value, error })
            : postInput}
        </EuiFlexGroup>
        {typeof footer === 'function' ? footer({ value, error }) : footer}
      </>
    </EuiFormRow>
  ) : (
    input
  );
};

const Input = {
  switch: InputFormSwitch,
  editor: InputFormEditor,
  filepicker: InputFormFilePicker,
  number: InputFormNumber,
  select: InputFormSelect,
  text: InputFormText,
  textarea: InputFormTextArea,
  password: InputFormPassword,
  custom: ({ component, ...rest }) => component(rest),
};
