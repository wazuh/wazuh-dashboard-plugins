import React from 'react';
import {
	EuiCodeEditor,
} from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormEditor = ({field, value, onChange}: IInputFormType) => {
  return (
    <EuiCodeEditor
      mode={field.options.editor.language}
      height='50px'
      width='100%'
      value={value}
      onChange={onChange}
    />
  );
};
