import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import ReactDOM from 'react-dom';
import { SecurityOperationsNavGroup } from '../..';
import { Layout } from '../../../layout';
import { createSideNavItems } from '../../../side-nav';
import { IT_HYGIENE_ID, SECURITY_OPERATIONS_ID } from '../../constants';
import { ItHygieneApp } from './it-hygiene-app';

export const renderApp = async (params: AppMountParameters) => {
  const items = createSideNavItems({
    group: SecurityOperationsNavGroup,
    selectedAppId: IT_HYGIENE_ID,
  });

  ReactDOM.render(
    <Layout aria-label={SECURITY_OPERATIONS_ID} items={items}>
      <ItHygieneApp params={params} />
    </Layout>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
};
