import { i18n } from '@osd/i18n';
import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import { UI_COLOR_STATUS } from '../../../../../../common/constants';

const getVisStateTopVulnerabilitiesScore = (indexPatternId: string) => {
  return {
    id: 'most_detected_vulnerabilities',
    title: i18n.translate(
      'wazuh.vulnerabilityDetection.vulnerabilityScorePanel.title',
      { defaultMessage: 'Most common vulnerability score' },
    ),
    type: 'horizontal_bar',
    params: {
      addLegend: false,
      addTimeMarker: false,
      addTooltip: true,
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          labels: {
            filter: false,
            rotate: 0,
            show: true,
            truncate: 200,
          },
          position: 'left',
          scale: {
            type: 'linear',
          },
          show: true,
          style: {},
          title: {},
          type: 'category',
        },
      ],
      grid: {
        categoryLines: false,
        valueAxis: '',
      },
      labels: {
        show: false,
      },
      legendPosition: 'right',
      seriesParams: [
        {
          data: {
            id: '1',
            label: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerabilityScorePanel.seriesLabel',
              { defaultMessage: 'Count' },
            ),
          },
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          mode: 'normal',
          show: true,
          showCircles: true,
          type: 'histogram',
          valueAxis: 'ValueAxis-1',
        },
      ],
      thresholdLine: {
        color: '#E7664C',
        show: false,
        style: 'full',
        value: 10,
        width: 1,
      },
      times: [],
      type: 'histogram',
      valueAxes: [
        {
          id: 'ValueAxis-1',
          labels: {
            filter: true,
            rotate: 75,
            show: true,
            truncate: 100,
          },
          name: 'LeftAxis-1',
          position: 'bottom',
          scale: {
            mode: 'normal',
            type: 'linear',
          },
          show: true,
          style: {},
          title: {
            text: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerabilityScorePanel.valueAxisTitle',
              { defaultMessage: 'Count' },
            ),
          },
          type: 'value',
        },
      ],
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {},
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: 'vulnerability.score.base',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerabilityScorePanel.otherBucketLabel',
              { defaultMessage: 'Other' },
            ),
            missingBucket: false,
            missingBucketLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerabilityScorePanel.missingBucketLabel',
              { defaultMessage: 'Missing' },
            ),
            customLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerabilityScorePanel.baseScoreLabel',
              { defaultMessage: 'Vulnerability base score' },
            ),
          },
          schema: 'segment',
        },
      ],
    },
  };
};

const getVisStateTopVulnerableOSTypes = (indexPatternId: string) => {
  return {
    id: 'most_vulnerable_endpoints_vulnerabilities',
    title: i18n.translate(
      'wazuh.vulnerabilityDetection.vulnerableOsTypesPanel.title',
      { defaultMessage: 'Most vulnerable OS types' },
    ),
    type: 'horizontal_bar',
    params: {
      type: 'histogram',
      grid: {
        categoryLines: false,
      },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'left',
          show: true,
          style: {},
          scale: {
            type: 'linear',
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 200,
          },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'bottom',
          show: true,
          style: {},
          scale: {
            type: 'linear',
            mode: 'normal',
          },
          labels: {
            show: true,
            rotate: 75,
            filter: true,
            truncate: 100,
          },
          title: {
            text: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerableOsTypesPanel.valueAxisTitle',
              { defaultMessage: 'Count' },
            ),
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'histogram',
          mode: 'stacked',
          data: {
            label: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerableOsTypesPanel.seriesLabel',
              { defaultMessage: 'Count' },
            ),
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: false,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: {},
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#E7664C',
      },
    },
    uiState: {
      vis: {
        legendOpen: false,
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {
            customLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerableOsTypesPanel.countLabel',
              { defaultMessage: 'Count' },
            ),
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: 'host.os.type',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerableOsTypesPanel.otherBucketLabel',
              { defaultMessage: 'Other' },
            ),
            missingBucket: false,
            missingBucketLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerableOsTypesPanel.missingBucketLabel',
              { defaultMessage: 'Missing' },
            ),
            customLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerableOsTypesPanel.hostOsTypeLabel',
              { defaultMessage: 'Host OS type' },
            ),
          },
          schema: 'segment',
        },
      ],
    },
  };
};

const getVisStateAccumulationMostDetectedVulnerabilities = (
  indexPatternId: string,
) => {
  return {
    id: 'vulnerabilities_by_year_of_publication',
    title: i18n.translate(
      'wazuh.vulnerabilityDetection.vulnerabilitiesByYearPanel.title',
      { defaultMessage: 'Vulnerabilities by year of publication' },
    ),
    type: 'histogram',
    params: {
      type: 'histogram',
      grid: {
        categoryLines: false,
      },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: {
            type: 'linear',
          },
          labels: {
            show: true,
            filter: true,
            truncate: 100,
          },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'left',
          show: true,
          style: {},
          scale: {
            type: 'log',
            mode: 'normal',
            defaultYExtents: true,
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerabilitiesByYearPanel.valueAxisTitle',
              { defaultMessage: 'Count' },
            ),
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'histogram',
          mode: 'stacked',
          data: {
            label: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerabilitiesByYearPanel.seriesLabel',
              { defaultMessage: 'Count' },
            ),
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: {
        show: false,
      },
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#E7664C',
      },
    },
    uiState: {
      vis: {
        /* These colors should match the specified on the metric visualizations
        public/components/overview/vulnerabilities/dashboards/overview/vulnerability_detector_filters.scss
        */
        colors: {
          Critical: UI_COLOR_STATUS.failed,
          High: '#F5A700',
          Medium: UI_COLOR_STATUS.info,
          Low: UI_COLOR_STATUS.success,
        },
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {},
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          params: {
            field: 'vulnerability.published_at',
            timeRange: {
              from: 'now-24h',
              to: 'now',
            },
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'y',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerabilitiesByYearPanel.yearPublishedLabel',
              { defaultMessage: 'Year published' },
            ),
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'vulnerability.severity',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerabilitiesByYearPanel.otherBucketLabel',
              { defaultMessage: 'Other' },
            ),
            missingBucket: false,
            missingBucketLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.vulnerabilitiesByYearPanel.missingBucketLabel',
              { defaultMessage: 'Missing' },
            ),
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getDashboardPanels = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    '6': {
      gridData: {
        w: 16,
        h: 12,
        x: 0,
        y: 0,
        i: '6',
      },
      type: 'visualization',
      explicitInput: {
        id: '6',
        savedVis: getVisStateTopVulnerabilitiesScore(indexPatternId),
      },
    },
    '7': {
      gridData: {
        w: 16,
        h: 12,
        x: 16,
        y: 0,
        i: '7',
      },
      type: 'visualization',
      explicitInput: {
        id: '7',
        savedVis: getVisStateTopVulnerableOSTypes(indexPatternId),
      },
    },
    '8': {
      gridData: {
        w: 16,
        h: 12,
        x: 32,
        y: 0,
        i: '8',
      },
      type: 'visualization',
      explicitInput: {
        id: '8',
        savedVis:
          getVisStateAccumulationMostDetectedVulnerabilities(indexPatternId),
      },
    },
  };
};
