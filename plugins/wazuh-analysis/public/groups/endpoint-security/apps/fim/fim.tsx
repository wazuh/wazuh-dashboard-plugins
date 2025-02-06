import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { FIM_TITLE } from '../../constants';

interface FimAppProps {
  params: AppMountParameters;
}

export const FimApp = (_props: FimAppProps) => <>{FIM_TITLE} App</>;
