import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import ReactDOM from 'react-dom';
import { SecurityOperationsNavGroup } from '../..';
import { Layout } from '../../../layout';
import { createSideNavItems } from '../../../side-nav';
import {
  REGULATORY_COMPLIANCE_ID,
  SECURITY_OPERATIONS_TITLE,
} from '../../constants';
import { RegulatoryComplianceApp } from './regulatory-compliance-app';

export const renderApp = async (params: AppMountParameters) => {
  const items = createSideNavItems({
    group: SecurityOperationsNavGroup,
    selectedAppId: REGULATORY_COMPLIANCE_ID,
  });

  ReactDOM.render(
    <Layout aria-label={SECURITY_OPERATIONS_TITLE} items={items}>
      <RegulatoryComplianceApp params={params} />
    </Layout>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
};
