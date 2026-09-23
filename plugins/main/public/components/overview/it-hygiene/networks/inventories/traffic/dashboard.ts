import { i18n } from '@osd/i18n';
import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { getVisStateHorizontalBarByField } from '../../../common/saved-vis/generators';
import { getVisStateHorizontalBarSplitSeries } from '../../../../../../services/visualizations';
import { SavedVis } from '../../../common/types';

type InterfaceState = 'LISTEN' | 'ESTABLISHED';

const getVisStateInterfaceState = (
  indexPatternId: string,
  interfaceState: InterfaceState,
): SavedVis => {
  return {
    id: `it-hygiene-network-interfaces-${interfaceState}`,
    title: i18n.translate(
      'wazuh.itHygiene.trafficDashboard.interfaceState.title',
      {
        defaultMessage: 'Interfaces in {interfaceState} state',
        values: { interfaceState },
      },
    ),
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Green to Red',
        metricColorMode: 'None',
        colorsRange: [
          {
            from: 0,
            to: 10000,
          },
        ],
        labels: {
          show: true,
        },
        invertColors: false,
        style: STYLE,
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),

      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {
            customLabel: interfaceState,
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: `interface.state: ${interfaceState}`,
                  language: 'kuery',
                },
                label: i18n.translate(
                  'wazuh.itHygiene.trafficDashboard.interfaceState.filterLabel',
                  { defaultMessage: 'Interface State' },
                ),
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateUDPOnlyTransportsMetric = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-Transports-only-udp',
    title: i18n.translate(
      'wazuh.itHygiene.trafficDashboard.udpOnlyTransports.title',
      { defaultMessage: 'Transports operating only on UDP' },
    ),
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Green to Red',
        metricColorMode: 'None',
        colorsRange: [
          {
            from: 0,
            to: 10000,
          },
        ],
        labels: {
          show: true,
        },
        invertColors: false,
        style: STYLE,
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {
            customLabel: i18n.translate(
              'wazuh.itHygiene.trafficDashboard.udpOnlyTransports.label',
              { defaultMessage: 'UDP' },
            ),
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'network.transport:"UDP"',
                  language: 'kuery',
                },
                label: i18n.translate(
                  'wazuh.itHygiene.trafficDashboard.udpOnlyTransports.filterLabel',
                  { defaultMessage: 'Transport Protocols' },
                ),
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getOverviewProcessesPortTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'destination.port',
      i18n.translate(
        'wazuh.itHygiene.trafficDashboard.topDestinationPorts.title',
        { defaultMessage: 'Top 5 destination ports' },
      ),
      'it-hygiene-ports',
      {
        fieldSize: 5,
        metricCustomLabel: i18n.translate(
          'wazuh.itHygiene.trafficDashboard.topDestinationPorts.metricLabel',
          { defaultMessage: 'Top ports count' },
        ),
        valueAxesTitleText: ' ',
        seriesLabel: i18n.translate(
          'wazuh.itHygiene.trafficDashboard.topDestinationPorts.fieldLabel',
          { defaultMessage: 'Top ports' },
        ),
        seriesMode: 'normal',
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.trafficDashboard.topDestinationPorts.fieldLabel',
          { defaultMessage: 'Top ports' },
        ),
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'network.transport',
      i18n.translate(
        'wazuh.itHygiene.trafficDashboard.transportProtocols.title',
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
          'wazuh.itHygiene.trafficDashboard.transportProtocols.metricLabel',
          { defaultMessage: 'Transport protocols count' },
        ),
        valueAxesTitleText: ' ',
        seriesLabel: i18n.translate(
          'wazuh.itHygiene.trafficDashboard.transportProtocols.title',
          { defaultMessage: 'Transport protocols' },
        ),
        seriesMode: 'stacked',
        fieldCustomLabel: i18n.translate(
          'wazuh.itHygiene.trafficDashboard.transportProtocols.title',
          { defaultMessage: 'Transport protocols' },
        ),
      },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'process.name',
      i18n.translate('wazuh.itHygiene.trafficDashboard.topProcesses.title', {
        defaultMessage: 'Top 5 processes',
      }),
      'it-hygiene-ports',
      {
        customLabel: i18n.translate(
          'wazuh.itHygiene.trafficDashboard.topProcesses.fieldLabel',
          { defaultMessage: 'Processes' },
        ),
      },
    ),
  ]);
};
