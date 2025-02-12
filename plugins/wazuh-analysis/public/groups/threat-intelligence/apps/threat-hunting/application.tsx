import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import ReactDOM from 'react-dom';
import { ThreatIntelligenceNavGroup } from '../..';
import { Layout } from '../../../layout';
import { createSideNavItems } from '../../../side-nav';
import { THREAT_INTELLIGENCE_TITLE } from '../../constants';
import { ThreatHuntingApp } from './threat-hunting-app';
import { THREAT_HUNTING_ID } from './constants';

export const renderApp = async (params: AppMountParameters) => {
  const items = createSideNavItems({
    group: ThreatIntelligenceNavGroup,
    selectedAppId: THREAT_HUNTING_ID,
  });

  ReactDOM.render(
    <Layout aria-label={THREAT_INTELLIGENCE_TITLE} items={items}>
      <ThreatHuntingApp params={params} />
    </Layout>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
};
