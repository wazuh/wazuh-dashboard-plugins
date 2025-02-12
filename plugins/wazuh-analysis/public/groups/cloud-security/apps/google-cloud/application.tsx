import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import ReactDOM from 'react-dom';
import { Layout } from '../../../layout';
import { createSideNavItems } from '../../../side-nav';
import { CLOUD_SECURITY_TITLE } from '../../constants';
import { CloudSecurityNavGroup } from '../..';
import { GoogleCloudApp } from './google-cloud-app';
import { GOOGLE_CLOUD_ID } from './constants';

export const renderApp = async (params: AppMountParameters) => {
  const items = createSideNavItems({
    group: CloudSecurityNavGroup,
    selectedAppId: GOOGLE_CLOUD_ID,
  });

  ReactDOM.render(
    <Layout aria-label={CLOUD_SECURITY_TITLE} items={items}>
      <GoogleCloudApp params={params} />
    </Layout>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
};
