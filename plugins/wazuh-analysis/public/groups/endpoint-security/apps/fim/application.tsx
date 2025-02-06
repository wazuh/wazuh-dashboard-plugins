import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { Layout } from '../../../layout';
import { ENDPOINT_SECURITY_TITLE, FIM_ID } from '../../constants';
import { createEndpointSecurityNavItems } from '../../nav-items';
import { FimApp } from './fim-app';

export const renderApp = async (params: AppMountParameters) => {
  const items = createEndpointSecurityNavItems({
    selectedAppId: FIM_ID,
  });

  ReactDOM.render(
    <Layout aria-label={ENDPOINT_SECURITY_TITLE} items={items}>
      <FimApp params={params} />
    </Layout>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
};
