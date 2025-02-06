import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import ReactDOM from 'react-dom';
import { Layout } from '../../../layout';
import { createSideNavItems } from '../../../side-nav';
import { AWS_ID, CLOUD_SECURITY_TITLE } from '../../constants';
import { CloudSecurityNavGroup } from '../..';
import { AwsApp } from './aws-app';

export const renderApp = async (params: AppMountParameters) => {
  const items = createSideNavItems({
    group: CloudSecurityNavGroup,
    selectedAppId: AWS_ID,
  });

  ReactDOM.render(
    <Layout aria-label={CLOUD_SECURITY_TITLE} items={items}>
      <AwsApp params={params} />
    </Layout>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
};
