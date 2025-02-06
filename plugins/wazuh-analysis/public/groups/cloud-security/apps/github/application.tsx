import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import ReactDOM from 'react-dom';
import { Layout } from '../../../layout';
import { createSideNavItems } from '../../../side-nav';
import { CLOUD_SECURITY_TITLE, GITHUB_ID } from '../../constants';
import { CloudSecurityNavGroup } from '../..';
import { GithubApp } from './github-app';

export const renderApp = async (params: AppMountParameters) => {
  const items = createSideNavItems({
    group: CloudSecurityNavGroup,
    selectedAppId: GITHUB_ID,
  });

  ReactDOM.render(
    <Layout aria-label={CLOUD_SECURITY_TITLE} items={items}>
      <GithubApp params={params} />
    </Layout>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
};
