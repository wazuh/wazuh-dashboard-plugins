import {
  buildIndexPatternReferenceList,
  buildSearchSource,
  STYLE,
} from '../../../../../../lib';
import type { SavedVis } from '../../../../../../types';

/**
 *  You can apply the same logic here using ERRORS instead of DROPS. In both cases, a lower percentage indicates everything is working fine. If the percentage rises too much, it means there's a problem that needs attention.
 */
export const getVisStateGlobalPacketLossMetric = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-it-hygiene-network-interfaces-global-packet-loss-rate',
    title: 'Average packet loss rate',
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'avg',
          params: {
            field: 'host.network.ingress.drops',
            json: JSON.stringify({
              script: {
                source: `
                  float in_drops=(doc['host.network.ingress.drops'].size() != 0 ? doc['host.network.ingress.drops'].value : 0);
                  float in_errors=(doc['host.network.ingress.errors'].size() != 0 ? doc['host.network.ingress.errors'].value : 0);
                  float in_packets=(doc['host.network.ingress.packets'].size() != 0 ? doc['host.network.ingress.packets'].value : 0);
                  float out_drops=(doc['host.network.egress.drops'].size() != 0 ? doc['host.network.egress.drops'].value : 0);
                  float out_errors=(doc['host.network.egress.errors'].size() != 0 ? doc['host.network.egress.errors'].value : 0);
                  float out_packets=(doc['host.network.egress.packets'].size() != 0 ? doc['host.network.egress.packets'].value : 0);
                  float d=(in_drops + out_drops);
                  float p=(in_drops + in_errors + in_packets + out_drops + out_errors + out_packets);
                  return p == 0 ? 0 : Math.round((d/p)*100*100);
                `.trim(),
                lang: 'painless',
              },
            }) /*
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
