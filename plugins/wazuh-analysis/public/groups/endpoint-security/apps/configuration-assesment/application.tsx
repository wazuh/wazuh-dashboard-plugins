import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import ReactDOM from 'react-dom';
import { EndpointSecurityNavGroup } from '../..';
import { Layout } from '../../../layout';
import { createSideNavItems } from '../../../side-nav';
import {
  CONFIGURATION_ASSESSMENT_ID,
  ENDPOINT_SECURITY_TITLE,
} from '../../constants';
import { ConfigurationAssessmentApp } from './configuration-assesment-app';

export const renderApp = async (params: AppMountParameters) => {
  const items = createSideNavItems({
    group: EndpointSecurityNavGroup,
    selectedAppId: CONFIGURATION_ASSESSMENT_ID,
  });

  ReactDOM.render(
    <Layout aria-label={ENDPOINT_SECURITY_TITLE} items={items}>
      <ConfigurationAssessmentApp params={params} />
    </Layout>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
};
