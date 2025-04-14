import React from 'react';
import { EuiFieldPassword } from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormPassword = ({
  value,
  isInvalid,
  onChange,
  placeholder,
  fullWidth,
  options,
}: IInputFormType) => (
  <EuiFieldPassword
    fullWidth={fullWidth === undefined ? true : fullWidth}
    value={value}
    isInvalid={isInvalid}
    onChange={onChange}
    placeholder={placeholder}
    type={options?.password?.type || 'dual'}
  />
);
