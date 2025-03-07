import React from 'react';
import { EuiFieldNumber } from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormNumber = ({
  options,
  value,
  onChange,
}: IInputFormType) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { integer, ...rest } = options?.number || {};

  return (
    <EuiFieldNumber fullWidth value={value} onChange={onChange} {...rest} />
  );
};
