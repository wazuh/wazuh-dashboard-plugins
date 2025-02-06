import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { REGULATORY_COMPLIANCE_TITLE } from '../../constants';

interface RegulatoryComplianceProps {
  params: AppMountParameters;
}

export const RegulatoryComplianceApp = (_props: RegulatoryComplianceProps) => (
  <>{REGULATORY_COMPLIANCE_TITLE} App</>
);
