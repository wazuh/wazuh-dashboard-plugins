import React, { ChangeEvent } from 'react';
import { InputForm } from '../../../components/common/form';
import { Steps } from '../components/steps/steps';
import './register-agent.scss';

export const RegisterAgent: React.FC = () => {
  return (
    <div className='container'>
      <div className='title'>Deploy new agent</div>
      <Steps />
    </div>
  );
};
