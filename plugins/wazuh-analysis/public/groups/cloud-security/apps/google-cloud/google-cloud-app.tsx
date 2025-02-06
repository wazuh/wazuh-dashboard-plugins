import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { GOOGLE_CLOUD_TITLE } from '../../constants';

interface GoogleCloudAppProps {
  params: AppMountParameters;
}

export const GoogleCloudApp = (_props: GoogleCloudAppProps) => (
  <>{GOOGLE_CLOUD_TITLE} App</>
);
