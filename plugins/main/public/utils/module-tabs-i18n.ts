import { i18n } from '@osd/i18n';

const t = (id: string, defaultMessage: string) =>
  i18n.translate(`wazuh.moduleTabs.${id}`, { defaultMessage });

export const moduleTabsI18n = {
  dashboard: t('dashboard', 'Dashboard'),
  findings: t('findings', 'Findings'),
  responses: t('responses', 'Responses'),
  showInDashboard: (label: string) =>
    i18n.translate('wazuh.moduleTabs.showInDashboard', {
      defaultMessage: 'Show {label} in Dashboard',
      values: { label },
    }),
  inspectInFindings: (label: string) =>
    i18n.translate('wazuh.moduleTabs.inspectInFindings', {
      defaultMessage: 'Inspect {label} in Findings',
      values: { label },
    }),
};
