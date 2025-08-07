import { buildDashboardKPIPanels } from '../common/create-dashboard-panels-kpis';
import { STYLE } from '../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../common/saved-vis/create-saved-vis-data';
import { getVisStatePieByField } from '../common/saved-vis/generators';
import { SavedVis } from '../common/types';

type ProcessState =
  | 'Stopped'
  | 'Zombie'
  | 'Interruptable Sleep'
  | 'Uninterruptible Sleep';

const getVisStateFailedServicesMetric = (indexPatternId: string): SavedVis => {
  return {
    id: 'it-hygiene-services-failed-services',
    title: 'Services in failed state',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: true,
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
          type: 'avg',
          params: {
            field: 'host.network.ingress.drops',
            json: "\
              {\
                \"script\": {\
                  \"source\": \" \
                    float in_drops=(doc['host.network.ingress.drops'].size() != 0 ? doc['host.network.ingress.drops'].value : 0); \
                    float in_errors=(doc['host.network.ingress.errors'].size() != 0 ? doc['host.network.ingress.errors'].value : 0); \
                    float in_packets=(doc['host.network.ingress.packets'].size() != 0 ? doc['host.network.ingress.packets'].value : 0); \
                    float out_drops=(doc['host.network.egress.drops'].size() != 0 ? doc['host.network.egress.drops'].value : 0); \
                    float out_errors=(doc['host.network.egress.errors'].size() != 0 ? doc['host.network.egress.errors'].value : 0); \
                    float out_packets=(doc['host.network.egress.packets'].size() != 0 ? doc['host.network.egress.packets'].value : 0); \
                    float d=(in_drops + out_drops); \
                    float p=(in_drops + in_errors + in_packets + out_drops + out_errors + out_packets); \
                    return p == 0 ? 0 : Math.round((d/p)*100*100);\", \
                  \"lang\": \"painless\" \
                }\
              }" /*
                The total packets is the sum of: packets, drops and erros.
                The result is multiplied by:
                - 100 to convert the value (d/p) to percent (%)
                WORKAROUND: multiply 100 to equilibrate the division by 100 done when the `isPercentMode` is true
              */,

            customLabel: 'Average packet loss rate',
          },
          schema: 'metric',
        },
      ],
    },
  };
};
export const getOverviewServicesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStatePieByField(
      indexPatternId,
      'service.state',
      'Services by state',
      'it-hygiene-services',
    ),
  ]);
};
