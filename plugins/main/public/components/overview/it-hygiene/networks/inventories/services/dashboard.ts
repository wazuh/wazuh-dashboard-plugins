import { i18n } from '@osd/i18n';
import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { getVisStateHorizontalBarByField } from '../../../common/saved-vis/generators';
import { getVisStateHorizontalBarSplitSeries } from '../../../../../../services/visualizations';

export const getOverviewProcessesPortTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'source.port',
      i18n.translate(
        'wazuh.itHygiene.listenersDashboard.topSourcePorts.title',
        { defaultMessage: 'Top 5 source ports' },
      ),
      'it-hygiene-ports',
      {
        fieldSize: 5,
        metricCustomLabel: i18n.translate(
          'wazuh.itHygiene.listenersDashboard.topSourcePorts.metricLabel',
          { defaultMessage: 'Top ports count' },
        ),
        valueAxesTitleText: ' ',
        seriesLabel: i18n.translate(
          'wazuh.itHygiene.listenersDashboard.topSourcePorts.fieldLabel',
          { defaultMessage: 'Top ports' },
        ),
        seriesMode: 'normal',
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.listenersDashboard.topSourcePorts.fieldLabel',
          { defaultMessage: 'Top ports' },
        ),
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'network.transport',
      i18n.translate(
        'wazuh.itHygiene.listenersDashboard.transportProtocols.title',
        { defaultMessage: 'Transport protocols' },
      ),
      'it-hygiene-ports',
      {
        fieldSize: 4,
        otherBucket: i18n.translate(
          'wazuh.itHygiene.savedVis.othersBucketLabel',
          { defaultMessage: 'Others' },
        ),
        metricCustomLabel: i18n.translate(
          'wazuh.itHygiene.listenersDashboard.transportProtocols.metricLabel',
          { defaultMessage: 'Transport protocols count' },
        ),
        valueAxesTitleText: ' ',
        seriesLabel: i18n.translate(
          'wazuh.itHygiene.listenersDashboard.transportProtocols.title',
          { defaultMessage: 'Transport protocols' },
        ),
        seriesMode: 'stacked',
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.listenersDashboard.transportProtocols.title',
          { defaultMessage: 'Transport protocols' },
        ),
      },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'process.name',
      i18n.translate('wazuh.itHygiene.listenersDashboard.topProcesses.title', {
        defaultMessage: 'Top 5 processes',
      }),
      'it-hygiene-ports',
      {
        customLabel: i18n.translate(
          'wazuh.itHygiene.listenersDashboard.topProcesses.fieldLabel',
          { defaultMessage: 'Processes' },
        ),
      },
    ),
  ]);
};
