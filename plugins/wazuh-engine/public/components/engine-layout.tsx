import React from 'react';
import { EuiTitle } from '@elastic/eui';

export const EngineLayout = ({ children, title }) => {
  return (
    <>
      <EuiTitle>
        <h1>{title}</h1>
      </EuiTitle>
      <div>{children}</div>
    </>
  );
};
