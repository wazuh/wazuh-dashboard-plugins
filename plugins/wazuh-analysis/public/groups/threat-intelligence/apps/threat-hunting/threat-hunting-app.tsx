import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { THREAT_HUNTING_TITLE } from './constants';

interface ThreatHuntingAppProps {
  params: AppMountParameters;
}

export const ThreatHuntingApp = (_props: ThreatHuntingAppProps) => (
  <>{THREAT_HUNTING_TITLE} App</>
);
