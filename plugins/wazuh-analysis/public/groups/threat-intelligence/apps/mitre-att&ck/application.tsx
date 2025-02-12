import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import ReactDOM from 'react-dom';
import { ThreatIntelligenceNavGroup } from '../..';
import { Layout } from '../../../layout';
import { createSideNavItems } from '../../../side-nav';
import { THREAT_INTELLIGENCE_TITLE } from '../../constants';
import { MitreAttackApp } from './mitre-att&ck-app';
import { MITRE_ATTACK_ID } from './constants';

export const renderApp = async (params: AppMountParameters) => {
  const items = createSideNavItems({
    group: ThreatIntelligenceNavGroup,
    selectedAppId: MITRE_ATTACK_ID,
  });

  ReactDOM.render(
    <Layout aria-label={THREAT_INTELLIGENCE_TITLE} items={items}>
      <MitreAttackApp params={params} />
    </Layout>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
};
