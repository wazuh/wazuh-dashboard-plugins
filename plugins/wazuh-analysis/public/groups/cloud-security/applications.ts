import {
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
} from 'opensearch-dashboards/public';
import { Subject } from 'rxjs';
import { i18n } from '@osd/i18n';
import { buildSubAppId } from '../../utils';
import { PLUGIN_ID } from '../../../common/constants';
import { CLOUD_SECURITY_ID } from './cloud-security';

export const DOCKER_ID = buildSubAppId(CLOUD_SECURITY_ID, 'docker');
export const AWS_ID = buildSubAppId(CLOUD_SECURITY_ID, 'aws');
export const GOOGLE_CLOUD_ID = buildSubAppId(CLOUD_SECURITY_ID, 'google_cloud');
export const GITHUB_ID = buildSubAppId(CLOUD_SECURITY_ID, 'github');
export const OFFICE365_ID = buildSubAppId(CLOUD_SECURITY_ID, 'office365');
export const DOCKER_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${DOCKER_ID}`,
  {
    defaultMessage: 'Docker',
  },
);
export const AWS_TITLE = i18n.translate(`${PLUGIN_ID}.category.${AWS_ID}`, {
  defaultMessage: 'AWS',
});
export const GOOGLE_CLOUD_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${GOOGLE_CLOUD_ID}`,
  {
    defaultMessage: 'Google Cloud',
  },
);
export const GITHUB_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${GITHUB_ID}`,
  {
    defaultMessage: 'Github',
  },
);
export const OFFICE365_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${OFFICE365_ID}`,
  {
    defaultMessage: 'Office 365',
  },
);

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
        // TODO: Implement the aws application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
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
