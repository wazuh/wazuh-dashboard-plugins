import { Subject } from 'rxjs';
import {
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
} from '../../../../../src/core/public';
import { DOCKER_ID, DOCKER_TITLE } from './apps/docker/constants';
import { AWS_ID, AWS_TITLE } from './apps/aws/constants';
import {
  GOOGLE_CLOUD_ID,
  GOOGLE_CLOUD_TITLE,
} from './apps/google-cloud/constants';
import { GITHUB_ID, GITHUB_TITLE } from './apps/github/constants';
import { OFFICE365_ID, OFFICE365_TITLE } from './apps/office-365/constants';

export function getCloudSecurityApps(updater$?: Subject<AppUpdater>) {
  return [
    {
      id: DOCKER_ID,
      title: DOCKER_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/docker/application');

        return await renderApp(params);
      },
    },
    {
      id: AWS_ID,
      title: AWS_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/aws/application');

        return await renderApp(params);
      },
    },
    {
      id: GOOGLE_CLOUD_ID,
      title: GOOGLE_CLOUD_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/google-cloud/application');

        return await renderApp(params);
      },
    },
    {
      id: GITHUB_ID,
      title: GITHUB_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/github/application');

        return await renderApp(params);
      },
    },
    {
      id: OFFICE365_ID,
      title: OFFICE365_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/office-365/application');

        return await renderApp(params);
      },
    },
  ];
}
