import { buildWebDocUrl } from './services/web_documentation';

export const DOC_LINKS = {
  USER_MANUAL: {
    WAZUH_DASHBOARD: {
      SETTINGS: buildWebDocUrl('user-manual/wazuh-dashboard/settings.html'),
      CUSTOM_BRANDING: buildWebDocUrl(
        'user-manual/wazuh-dashboard/custom-branding.html',
      ),
    },
  },
} as const;
