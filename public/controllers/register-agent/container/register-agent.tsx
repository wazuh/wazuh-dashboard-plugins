import React, { ChangeEvent } from 'react';
import { InputForm } from '../../../components/common/form';
import './register-agent.scss';

export const RegisterAgent = () => {
  const handleChange = (event: ChangeEvent<any>) => {
    // ver
  };

  return (
    <div className='container'>
      <InputForm
        type='custom'
        onChange={handleChange}
        label='Etiqueta del Campo'
        rest={undefined}
        value={undefined}
      />
    </div>
  );
};
