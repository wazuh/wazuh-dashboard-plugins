import React from 'react';
import { Layout } from '../../../layout';
import {
  CONFIGURATION_ASSESSMENT_ID,
  CONFIGURATION_ASSESSMENT_TITLE,
  ENDPOINT_SECURITY_TITLE,
} from '../../constants';
import { createEndpointSecurityNavItems } from '../../nav-items';

const ConfigurationAssessmentApp = () => {
  const items = createEndpointSecurityNavItems({
    selectedAppId: CONFIGURATION_ASSESSMENT_ID,
  });

  return (
    <Layout aria-label={ENDPOINT_SECURITY_TITLE} items={items}>
      {CONFIGURATION_ASSESSMENT_TITLE} App
    </Layout>
  );
};

export default ConfigurationAssessmentApp;
