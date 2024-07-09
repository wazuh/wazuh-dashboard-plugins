import React from 'react';
import { EuiTitle } from '@elastic/eui';
import { getCore } from '../plugin-services';

export const EngineLayout = ({ children, title }) => {
  React.useEffect(() => {
    getCore().chrome.setBreadcrumbs([
      {
        className: 'osdBreadcrumbs',
        text: 'Engine',
      },
      {
        className: 'osdBreadcrumbs',
        text: title,
      },
    ]);
  }, []);
  return (
    <>
      {/* <EuiTitle>
        <h1>{title}</h1>
      </EuiTitle> */}
      <div>{children}</div>
    </>
  );
};
