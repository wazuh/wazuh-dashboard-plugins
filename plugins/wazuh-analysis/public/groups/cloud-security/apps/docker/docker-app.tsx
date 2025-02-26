import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { DOCKER_TITLE } from './constants';

interface DockerAppProps {
  params: AppMountParameters;
}

export const DockerApp = (_props: DockerAppProps) => <>{DOCKER_TITLE} App</>;
