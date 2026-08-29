import { i18n } from '@osd/i18n';

const t = (id: string, defaultMessage: string) =>
  i18n.translate(`wazuh.sca.${id}`, { defaultMessage });

export const scaI18n = {
  inventory: t('inventory', 'Inventory'),
  indexPatternMissingTitle: t(
    'indexPatternMissingTitle',
    'Configuration Assessment could be disabled or has a problem',
  ),
  indexPatternMissingBody: t(
    'indexPatternMissingBody',
    'If this is enabled, then this could be caused by an error in: server side, server-indexer connection or indexer side. Review the server and indexer logs.',
  ),
  indexPatternMissingDocsIntro: t(
    'indexPatternMissingDocsIntro',
    'Also, you can check the',
  ),
  indexPatternMissingDocs: t(
    'indexPatternMissingDocs',
    'configuration assessment documentation.',
  ),
  refresh: t('refresh', 'Refresh'),
  dashboardTabTitle: t(
    'dashboardTabTitle',
    'Security Configuration Assessment dashboard',
  ),
  dashboardTabDescription: t(
    'dashboardTabDescription',
    'Dashboard of the Security Configuration Assessment',
  ),
  checkDetails: t('checkDetails', 'Check Details'),
  filterPolicy: t('filterPolicy', 'Policy'),
  filterCheck: t('filterCheck', 'Check'),
  description: t('description', 'Description'),
  rationale: t('rationale', 'Rationale'),
  remediation: t('remediation', 'Remediation'),
  checkWithCondition: (condition: string) =>
    i18n.translate('wazuh.sca.checkWithCondition', {
      defaultMessage: 'Check (Condition: {condition})',
      values: { condition },
    }),
  compliance: t('compliance', 'Compliance'),
  mitre: t('mitre', 'Mitre'),
};
