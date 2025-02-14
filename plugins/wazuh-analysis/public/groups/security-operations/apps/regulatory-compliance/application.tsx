import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import ReactDOM from 'react-dom';
import { AppProps } from '../../../../../../wazuh-core/public/services/application/types';
import { RegulatoryComplianceApp } from './regulatory-compliance-app';

export const renderApp = async (
  params: AppMountParameters,
  { Layout }: AppProps,
) => {
  ReactDOM.render(
    <Layout>
      <RegulatoryComplianceApp params={params} />
    </Layout>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
};
