import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { INCIDENT_RESPONSE_TITLE } from './constants';

interface IncidentResponseAppProps {
  params: AppMountParameters;
}

export const IncidentResponseApp = (_props: IncidentResponseAppProps) => (
  <>{INCIDENT_RESPONSE_TITLE} App</>
);
