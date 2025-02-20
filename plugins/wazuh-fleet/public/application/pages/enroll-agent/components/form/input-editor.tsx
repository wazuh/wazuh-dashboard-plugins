import React from 'react';
import { EuiCodeEditor } from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormEditor = ({
  options,
  value,
  onChange,
}: IInputFormType) => (
  <EuiCodeEditor
    mode={options.editor.language}
    height='50px'
    width='100%'
    value={value}
    onChange={onChange}
  />
);
