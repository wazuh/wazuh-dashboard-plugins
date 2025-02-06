import React from 'react';
import { EuiSelect } from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormSelect = ({
  options,
  value,
  onChange,
  placeholder,
  dataTestSubj,
}: IInputFormType) => {
  return (
    <EuiSelect
      options={options.select}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-test-subj={dataTestSubj}
    />
  );
};
