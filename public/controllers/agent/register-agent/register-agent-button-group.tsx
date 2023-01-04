import { EuiButtonGroup } from '@elastic/eui';
import React, { useEffect } from 'react';

interface RegisterAgentButtonGroupProps {
  legend: string;
  options: Array<{id: string, label: string, default?: boolean}>;
  idSelected: string;
  onChange: (value: string) => void;
}

export default function RegisterAgentButtonGroup({
  legend,
  options,
  idSelected,
  onChange,
}: RegisterAgentButtonGroupProps) {

  useEffect(() => {
    setDefaultOptions();
  }, []);

  useEffect(() => {
    setDefaultOptions();
  }, [options, idSelected])

  /**
   * Set default option
   * Autoselect option when there is only one option
   * Autoselect option when an option have default property in true
   */
  const setDefaultOptions = () => {
    if(!idSelected){ // prevent autoselect every time the options change
      if (options.length === 1) {
        idSelected = options[0].id;
        onChange(options[0].id);
      }else if(options.filter(item => item.default).length > 0){
        const defaultOption = options.filter(item => item.default)[0].id
        idSelected = defaultOption;
        onChange(defaultOption);
      }
    }
  };

  return (
    <EuiButtonGroup
      color='primary'
      legend={legend}
      options={options}
      idSelected={idSelected}
      onChange={onChange}
      className={'wz-flex'}
    />
  );
}
