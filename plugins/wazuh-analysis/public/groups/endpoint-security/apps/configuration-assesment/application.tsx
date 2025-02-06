import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { createEndpointSecurityNavItems } from '../../nav-items';
import {
  CONFIGURATION_ASSESSMENT_ID,
  ENDPOINT_SECURITY_TITLE,
} from '../../constants';
import { Layout } from '../../../layout';
import { ConfigurationAssessmentApp } from './configuration-assesment-app';

export const renderApp = async (params: AppMountParameters) => {
  const items = createEndpointSecurityNavItems({
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
