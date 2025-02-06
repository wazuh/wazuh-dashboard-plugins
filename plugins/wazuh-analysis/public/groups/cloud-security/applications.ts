import { Subject } from 'rxjs';
import {
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
} from '../../../../../src/core/public';
import {
  AWS_ID,
  AWS_TITLE,
  DOCKER_ID,
  DOCKER_TITLE,
  GITHUB_ID,
  GITHUB_TITLE,
  GOOGLE_CLOUD_ID,
  GOOGLE_CLOUD_TITLE,
  OFFICE365_ID,
  OFFICE365_TITLE,
} from './constants';

export function getCloudSecurityApps(updater$?: Subject<AppUpdater>) {
  return [
    {
      id: DOCKER_ID,
      title: DOCKER_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        // TODO: Implement the docker application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
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
        // TODO: Implement the google cloud application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
      },
    },
    {
      id: GITHUB_ID,
      title: GITHUB_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        // TODO: Implement the github application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
      },
    },
    {
      id: OFFICE365_ID,
      title: OFFICE365_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        // TODO: Implement the office365 application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
      },
    },
  ];
}
