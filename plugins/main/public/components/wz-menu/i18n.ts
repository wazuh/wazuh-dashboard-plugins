import { i18n } from '@osd/i18n';

const t = (id: string, defaultMessage: string) =>
  i18n.translate(`wz-menu.${id}`, { defaultMessage });

export const wzMenuI18n = {
  managerApi: t('managerApi', 'Manager API'),
  serverApiNotSelected: t('serverApiNotSelected', 'Server API is not selected'),
  errorChangingApi: t('errorChangingApi', 'Error changing the selected API'),
  apiSelector: t('apiSelector', 'API selector'),
  reload: t('reload', 'Reload'),
  error: t('error', 'Error'),
  serverNotReady: t('serverNotReady', 'Server not ready yet.'),
  serverCouldNotRecover: t(
    'serverCouldNotRecover',
    'Server could not be recovered.',
  ),
  restartingPrefix: t('restartingPrefix', 'Restarting'),
  restartingNode: (node: string) =>
    i18n.translate('wz-menu.restartingNode', {
      defaultMessage: 'Restarting {node}, please wait.',
      values: { node },
    }),
  pinnedApplicationsLimit: t(
    'pinnedApplicationsLimit',
    'The limit of pinned applications has been reached',
  ),
  togglePinApplication: t('togglePinApplication', 'Toggle pin application'),
};
