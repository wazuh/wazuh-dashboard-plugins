import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { INCIDENT_RESPONSE_TITLE } from '../../constants';

interface IncidentResponseProps {
  params: AppMountParameters;
}

export const IncidentResponseApp = (_props: IncidentResponseProps) => (
  <>{INCIDENT_RESPONSE_TITLE} App</>
);
