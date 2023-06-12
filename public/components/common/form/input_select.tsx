import React from 'react';
import { EuiSelect } from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormSelect = ({
  options,
  value,
  onChange,
  placeholder,
  selectedOptions,
  isDisabled,
  isClearable,
  dataTestSubj,
}: IInputFormType) => {
  return (
    <EuiSelect
      options={options.select}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      selectedOptions={selectedOptions}
      isDisabled={isDisabled}
      isClearable={isClearable}
      data-test-subj={dataTestSubj}
    />
  );
};
