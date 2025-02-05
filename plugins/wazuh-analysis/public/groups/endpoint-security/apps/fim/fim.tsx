import React from 'react';
import { Layout } from '../../../layout';
import { ENDPOINT_SECURITY_TITLE, FIM_ID, FIM_TITLE } from '../../constants';
import { createEndpointSecurityNavItems } from '../../nav-items';

const FimApp = () => {
  const items = createEndpointSecurityNavItems({ selectedAppId: FIM_ID });

  return (
    <Layout aria-label={ENDPOINT_SECURITY_TITLE} items={items}>
      {FIM_TITLE} App
    </Layout>
  );
};

export default FimApp;
