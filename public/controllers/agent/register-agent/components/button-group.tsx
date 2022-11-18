import React, { useState } from 'react';
import { EuiButtonGroup } from '@elastic/eui';
import { iButton } from '../config/new-config';

const StepButtonGroup = (
  props : { buttons: iButton[],
  legend: string,
  defaultValue: string,
  onChange: (id: string) => void }
) => {
  const { buttons, defaultValue, legend, onChange } = props;
  const [value, setValue] = useState(defaultValue || '');

  const handleOnChange = (value: any) => {
    setValue(value);
    onChange(value);
  };

  return (
    <EuiButtonGroup
      color='primary'
      legend={legend}
      options={buttons}
      idSelected={value}
      onChange={handleOnChange}
      className={'osButtonsStyle'}
    />
  );
};

export default StepButtonGroup;
