import React from 'react';
import { EuiFieldNumber } from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormNumber = ({
  options,
  value,
  onChange,
  placeholder,
  fullWidth,
  disabled,
}: IInputFormType) => {
  const { integer, ...rest } = options?.number || {};
  return (
    <EuiFieldNumber
      fullWidth={typeof fullWidth === 'undefined' ? true : fullWidth}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      {...rest}
    />
  );
};
