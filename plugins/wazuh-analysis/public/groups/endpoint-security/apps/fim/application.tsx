import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import ReactDOM from 'react-dom';
import { EndpointSecurityNavGroup } from '../..';
import { Layout } from '../../../layout';
import { createSideNavItems } from '../../../side-nav';
import { ENDPOINT_SECURITY_TITLE, FIM_ID } from '../../constants';
import { FimApp } from './fim-app';

export const renderApp = async (params: AppMountParameters) => {
  const items = createSideNavItems({
    group: EndpointSecurityNavGroup,
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
