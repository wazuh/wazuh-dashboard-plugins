import { generateVisualization } from '../../../common/create-new-visualization';
import { HEIGHT, STYLE } from '../../../common/saved-vis/constants';
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

const getVisStateNetworkInterfacesStateInactive = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-interfaces-state-inactive',
    title: 'Interfaces state Inactive',
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
            customLabel: 'Inactive',
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
                  query: 'observer.ingress.interface.state: Inactive',
                  language: 'kuery',
                },
                label: 'Interfaces',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateNetworkInterfacesStateUnknown = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-interfaces-state-unknown',
    title: 'Interfaces state Unknown',
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
            customLabel: 'Unknown',
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
                  query: 'observer.ingress.interface.state: Unknown',
                  language: 'kuery',
                },
                label: 'Interfaces',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getOverviewNetworksInterfacesTab = (indexPatternId: string) => {
  const MAX_WIDTH = 48;
  const COLS = 4;
  const WIDTH = MAX_WIDTH / COLS;
  return {
    ...generateVisualization({
      key: '0',
      width: WIDTH,
      height: HEIGHT,
      positionX: WIDTH * 0,
      positionY: 0,
      savedVis:
        getVisStateNetworkInterfacesGlobalPacketLossRate(indexPatternId),
    }),
    ...generateVisualization({
      key: '1',
      width: WIDTH,
      height: HEIGHT,
      positionX: WIDTH * 1,
      positionY: 0,
      savedVis: getVisStateNetworkInterfacesStateInactive(indexPatternId),
    }),
    ...generateVisualization({
      key: '2',
      width: WIDTH,
      height: HEIGHT,
      positionX: WIDTH * 2,
      positionY: 0,
      savedVis: getVisStateNetworkInterfacesStateUnknown(indexPatternId),
    }),
  };
};
