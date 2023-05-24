import React from 'react';
import { Steps } from '../steps/steps';
import './register-agent.scss';

export const RegisterAgent: React.FC = () => {
  return (
    <div className='container'>
      <div className='title'>Deploy new agent</div>
      <Steps />
    </div>
  );
};
