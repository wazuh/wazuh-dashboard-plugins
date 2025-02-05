import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters } from 'opensearch-dashboards/public';
import {
  AnalysisApp,
  AnalysisAppDependencies,
} from './components/analysis-app';

export const renderApp = async (
  { history, appBasePath, element }: AppMountParameters,
  dependencies: AnalysisAppDependencies,
) => {
  ReactDOM.render(
    <AnalysisApp
      dependencies={dependencies}
      appBasePath={appBasePath}
      history={history}
    />,
    element,
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
