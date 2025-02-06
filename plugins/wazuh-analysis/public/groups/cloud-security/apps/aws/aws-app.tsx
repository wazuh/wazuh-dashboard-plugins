import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { AWS_TITLE } from '../../constants';

interface AwsAppProps {
  params: AppMountParameters;
}

export const AwsApp = (_props: AwsAppProps) => <>{AWS_TITLE} App</>;
