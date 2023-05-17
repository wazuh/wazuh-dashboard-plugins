import React, { ChangeEvent } from 'react';
import { InputForm } from '../../../components/common/form';
import './os-card-container.scss';

const Container = () => {
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

export default Container;
