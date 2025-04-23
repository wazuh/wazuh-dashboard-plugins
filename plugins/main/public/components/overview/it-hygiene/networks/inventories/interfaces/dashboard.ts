import { generateVisualization } from '../../../common/create-new-visualization';
import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { SavedVis } from '../../../common/types';

const getVisStateNetworkInterfacesGlobalPacketLossRate = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-interfaces-global-packet-loss-rate',
    title: 'Global packet loss rate',
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
          type: 'sum',
          params: {
            field: 'host.network.ingress.drops',
            json: "\
              {\
                \"script\": {\
                  \"source\": \" \
                    double d=(doc['host.network.ingress.drops'].size() != 0 ? doc['host.network.ingress.drops'].value : 0) \
                      + (doc['host.network.egress.drops'].size() != 0 ? doc['host.network.egress.drops'].value : 0); \
                    double p=(doc['host.network.ingress.packets'].size() != 0 ? doc['host.network.ingress.packets'].value : 0) \
                      + (doc['host.network.egress.packets'].size() != 0 ? doc['host.network.egress.packets'].value : 0); \
                    return p == 0 ? 0 : (d/p);\", \
                  \"lang\": \"painless\" \
                }\
              }",
            customLabel: 'Global packet loss rate',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getOverviewNetworksInterfacesTab = (indexPatternId: string) => {
  return {
    ...generateVisualization({
      key: '0',
      width: 12,
      height: 6,
      positionX: 0,
      positionY: 0,
      savedVis:
        getVisStateNetworkInterfacesGlobalPacketLossRate(indexPatternId),
    }),
  };
};
