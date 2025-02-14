import { Subject } from 'rxjs';
import {
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
} from '../../../../../src/core/public';
import { ApplicationService } from '../../../../wazuh-core/public/services/application/application';
import { DOCKER_ID, DOCKER_TITLE } from './apps/docker/constants';
import { AWS_ID, AWS_TITLE } from './apps/aws/constants';
import {
  GOOGLE_CLOUD_ID,
  GOOGLE_CLOUD_TITLE,
} from './apps/google-cloud/constants';
import { GITHUB_ID, GITHUB_TITLE } from './apps/github/constants';
import { OFFICE365_ID, OFFICE365_TITLE } from './apps/office-365/constants';
import { CloudSecurityNavGroup } from '.';

export function getCloudSecurityApps(
  applicationService?: ApplicationService,
  updater$?: Subject<AppUpdater>,
) {
  const cloudSecurityLayout = applicationService?.createLayout(
    CloudSecurityNavGroup,
  );

  return [
    {
      id: DOCKER_ID,
      title: DOCKER_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/docker/application');

        return await renderApp(params, {
          Layout: cloudSecurityLayout!(DOCKER_ID),
        });
      },
    },
    {
      id: AWS_ID,
      title: AWS_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/aws/application');

        return await renderApp(params, {
          Layout: cloudSecurityLayout!(AWS_ID),
        });
      },
    },
    {
      id: GOOGLE_CLOUD_ID,
      title: GOOGLE_CLOUD_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/google-cloud/application');

        return await renderApp(params, {
          Layout: cloudSecurityLayout!(GOOGLE_CLOUD_ID),
        });
      },
    },
    {
      id: GITHUB_ID,
      title: GITHUB_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/github/application');

        return await renderApp(params, {
          Layout: cloudSecurityLayout!(GITHUB_ID),
        });
      },
    },
    {
      id: OFFICE365_ID,
      title: OFFICE365_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/office-365/application');

        return await renderApp(params, {
          Layout: cloudSecurityLayout!(OFFICE365_ID),
        });
      },
    },
  ];
}
