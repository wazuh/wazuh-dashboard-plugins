import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { MITRE_ATTACK_TITLE } from '../../constants';

interface MitreAttackProps {
  params: AppMountParameters;
}

export const MitreAttackApp = (_props: MitreAttackProps) => (
  <>{MITRE_ATTACK_TITLE} App</>
);
