import React from 'react';
import { EuiFieldText } from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormText = ({
  value,
  isInvalid,
  onChange,
  placeholder,
  fullWidth,
}: IInputFormType) => (
  <EuiFieldText
    fullWidth={fullWidth === undefined ? true : fullWidth}
    value={value}
    isInvalid={isInvalid}
    onChange={onChange}
    placeholder={placeholder}
  />
);
