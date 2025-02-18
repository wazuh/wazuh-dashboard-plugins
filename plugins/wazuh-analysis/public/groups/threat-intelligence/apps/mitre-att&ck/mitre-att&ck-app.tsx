import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { MITRE_ATTACK_TITLE } from './constants';

interface MitreAttackAppProps {
  params: AppMountParameters;
}

export const MitreAttackApp = (_props: MitreAttackAppProps) => (
  <>{MITRE_ATTACK_TITLE} App</>
);
