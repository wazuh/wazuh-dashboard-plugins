import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { CONFIGURATION_ASSESSMENT_TITLE } from './constants';

interface ConfigurationAssessmentAppProps {
  params: AppMountParameters;
}

export const ConfigurationAssessmentApp = (
  _props: ConfigurationAssessmentAppProps,
) => <>{CONFIGURATION_ASSESSMENT_TITLE} App</>;
