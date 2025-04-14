import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { REGULATORY_COMPLIANCE_TITLE } from './constants';

interface RegulatoryComplianceAppProps {
  params: AppMountParameters;
}

export const RegulatoryComplianceApp = (
  _props: RegulatoryComplianceAppProps,
) => <>{REGULATORY_COMPLIANCE_TITLE} App</>;
