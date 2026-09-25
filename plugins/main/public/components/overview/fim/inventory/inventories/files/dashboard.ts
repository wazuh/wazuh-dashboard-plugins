import { i18n } from '@osd/i18n';
import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../../../services/visualizations';
import { buildDashboardKPIPanels } from '../../../../it-hygiene/common/create-dashboard-panels-kpis';

export const getDashboard = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateTable(indexPatternId, 'file.path', '', 'fim-files-inventory', {
      size: 5,
      fieldCustomLabel: i18n.translate(
        'wazuh.fileIntegrityMonitoring.filesDashboard.topFilePathsLabel',
        {
          defaultMessage: 'Top 5 file paths',
        },
      ),
    }),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'file.owner',
      i18n.translate(
        'wazuh.fileIntegrityMonitoring.filesDashboard.fileOwnersTitle',
        {
          defaultMessage: 'File owners',
        },
      ),
      'fim-files-inventory',
      {
        fieldSize: 4,
        otherBucket: i18n.translate(
          'wazuh.fileIntegrityMonitoring.filesDashboard.othersBucketLabel',
          {
            defaultMessage: 'Others',
          },
        ),
        metricCustomLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.filesDashboard.fileOwnerCountMetricLabel',
          {
            defaultMessage: 'File owner count',
          },
        ),
        valueAxesTitleText: ' ',
        seriesLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.filesDashboard.fileOwnerCountSeriesLabel',
          {
            defaultMessage: 'File owner count',
          },
        ),
        fieldCustomLabel: i18n.translate(
          'wazuh.fileIntegrityMonitoring.filesDashboard.fileOwnerLabel',
          {
            defaultMessage: 'File owner',
          },
        ),
      },
    ),
  ]);
};
