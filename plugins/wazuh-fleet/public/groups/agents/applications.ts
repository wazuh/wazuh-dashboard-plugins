import { Subject } from 'rxjs';
import { createHashHistory } from 'history';
import { i18n } from '@osd/i18n';
import {
  App,
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
} from '../../../../../src/core/public';
import { ApplicationService } from '../../../../wazuh-core/public/services/application/application';
import { NavigationService } from '../../react-services/navigation-service';
import { PLUGIN_ID } from '../../../common/constants';
import { AGENTS_ID } from './constants';
import { AgentsNavGroup } from '.';

/**
 * The function `buildSubAppId` takes a parent app ID and a sub app ID, and
 * returns a combined ID with the sub app ID URL-encoded.
 * @param {string} parentAppId - The `parentAppId` parameter is a string
 * representing the ID of the parent application.
 * @param {string} subAppId - The `subAppId` parameter is a string representing the
 * ID of a sub-application within a parent application.
 */
function buildSubAppId(parentAppId: string, subAppId: string) {
  return `${parentAppId}_${encodeURIComponent(`/${subAppId}`)}`;
}

// TODO: This should be moved to the apps directory
export const AGENTS_SUMMARY_ID = buildSubAppId(AGENTS_ID, 'wz-agents-summary');

const AGENTS_SUMMARY_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${AGENTS_SUMMARY_ID}`,
  {
    defaultMessage: 'Summary',
  },
);

export function getApps(
  applicationService?: ApplicationService,
  updater$?: Subject<AppUpdater>,
): App[] {
  const Layout = applicationService?.createLayout(AgentsNavGroup);

  return [
    {
      id: AGENTS_SUMMARY_ID,
      title: AGENTS_SUMMARY_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      order: 1,
      updater$,
      mount: async (params: AppMountParameters) => {
        try {
          // TODO: This should be instantiated by app instead of using a singleton
          NavigationService.getInstance(createHashHistory());

          // Load application bundle
          const { renderApp } = await import('./../../application/render-app');

          params.element.classList.add('dscAppWrapper', 'wz-app');

          const unmount = await renderApp(params, {
            Layout: Layout!(AGENTS_SUMMARY_ID),
          });

          return () => {
            unmount();
          };
        } catch (error) {
          console.debug(error);
        }
      },
    },
  ];
}
