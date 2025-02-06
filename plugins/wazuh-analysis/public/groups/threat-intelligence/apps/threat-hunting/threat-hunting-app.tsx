import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { THREAT_HUNTING_TITLE } from '../../constants';

interface ThreatHuntingProps {
  params: AppMountParameters;
}

export const ThreatHuntingApp = (_props: ThreatHuntingProps) => (
  <>{THREAT_HUNTING_TITLE} App</>
);
