import { i18n } from '@osd/i18n';
import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../../../services/visualizations';
import { buildDashboardKPIPanels } from '../../../../it-hygiene/common/create-dashboard-panels-kpis';

export const getDashboard = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateTable(
      indexPatternId,
      'registry.path',
      '',
      'registry-keys-inventory',
      {
        size: 5,
        fieldCustomLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryKeysDashboard.topRegistryPathsLabel',
          {
            defaultMessage: 'Top 5 registry paths',
          },
        ),
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'registry.owner',
      i18n.translate(
        'wazuh.fileIntegrityMonitoring.registryKeysDashboard.registryOwnersTitle',
        {
          defaultMessage: 'Registry owners',
        },
      ),
      'registry-keys-inventory',
      {
        fieldSize: 4,
        otherBucket: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryKeysDashboard.ownersOthersBucketLabel',
          {
            defaultMessage: 'Others',
          },
        ),
        metricCustomLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryKeysDashboard.registryOwnerCountLabel',
          {
            defaultMessage: 'Registry owner count',
          },
        ),
        valueAxesTitleText: ' ',
        fieldCustomLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryKeysDashboard.registryOwnerLabel',
          {
            defaultMessage: 'Registry owner',
          },
        ),
        seriesLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryKeysDashboard.registryOwnerSeriesLabel',
          {
            defaultMessage: 'Registry owner',
          },
        ),
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'registry.group',
      i18n.translate(
        'wazuh.fileIntegrityMonitoring.registryKeysDashboard.registryGroupsTitle',
        {
          defaultMessage: 'Registry groups',
        },
      ),
      'registry-keys-inventory',
      {
        fieldSize: 4,
        otherBucket: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryKeysDashboard.groupsOthersBucketLabel',
          {
            defaultMessage: 'Others',
          },
        ),
        metricCustomLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryKeysDashboard.registryGroupsCountLabel',
          {
            defaultMessage: 'Registry groups count',
          },
        ),
        valueAxesTitleText: ' ',
        fieldCustomLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryKeysDashboard.registryGroupLabel',
          {
            defaultMessage: 'Registry group',
          },
        ),
        seriesLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.registryKeysDashboard.registryGroupSeriesLabel',
          {
            defaultMessage: 'Registry group',
          },
        ),
      },
    ),
  ]);
};
