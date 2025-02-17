import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { GITHUB_TITLE } from './constants';

interface GithubAppProps {
  params: AppMountParameters;
}

export const GithubApp = (_props: GithubAppProps) => <>{GITHUB_TITLE} App</>;
