import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters } from 'opensearch-dashboards/public';
import FimApp from './fim';

export const renderApp = async ({ element }: AppMountParameters) => {
  ReactDOM.render(<FimApp />, element);

  return () => ReactDOM.unmountComponentAtNode(element);
};
