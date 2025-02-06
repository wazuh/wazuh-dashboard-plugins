import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import ReactDOM from 'react-dom';
import { ThreatIntelligenceNavGroup } from '../..';
import { Layout } from '../../../layout';
import { createSideNavItems } from '../../../side-nav';
import { MITRE_ATTACK_ID, THREAT_HUNTING_TITLE } from '../../constants';
import { MitreAttackApp } from './mitre-att&ck-app';

export const renderApp = async (params: AppMountParameters) => {
  const items = createSideNavItems({
    group: ThreatIntelligenceNavGroup,
    selectedAppId: MITRE_ATTACK_ID,
  });

  ReactDOM.render(
    <Layout aria-label={THREAT_HUNTING_TITLE} items={items}>
      <MitreAttackApp params={params} />
    </Layout>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
};
