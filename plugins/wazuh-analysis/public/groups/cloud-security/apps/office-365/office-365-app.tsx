import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { OFFICE365_TITLE } from '../../constants';

interface Office365AppProps {
  params: AppMountParameters;
}

export const Office365App = (_props: Office365AppProps) => (
  <>{OFFICE365_TITLE} App</>
);
