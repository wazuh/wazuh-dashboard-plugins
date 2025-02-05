import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters } from 'opensearch-dashboards/public';
import ConfigurationAssessmentApp from './configuration-assesment';

export const renderApp = async ({ element }: AppMountParameters) => {
  ReactDOM.render(<ConfigurationAssessmentApp />, element);

  return () => ReactDOM.unmountComponentAtNode(element);
};
