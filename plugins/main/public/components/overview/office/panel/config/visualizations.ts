export const getVisStateOfficeMetricStats = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-Office-Metric-Stats',
    title: 'Stats',
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
        style: {
          bgFill: '#000',
          bgColor: false,
          labelColor: false,
          subText: '',
          fontSize: 60,
        },
      },
    },

    uiState: {
      vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
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
          id: '2',
          enabled: true,
          type: 'count',
          params: {
            customLabel: 'Total Alerts',
          },
          schema: 'metric',
        },
        {
          id: '1',
          enabled: true,
          type: 'top_hits',
          params: {
            field: 'rule.level',
            aggregate: 'concat',
            size: 1,
            sortField: 'rule.level',
            sortOrder: 'desc',
            customLabel: 'Max rule level detected',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getVisStateOfficeTopsEventsPie = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-Office-Top-Events-Pie',
    title: 'Top Events',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: false,
      labels: {
        show: false,
        values: true,
        last_level: true,
        truncate: 100,
      },
      row: true,
    },

    uiState: {
      vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
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
          enabled: false,
          type: 'terms',
          params: {
            field: 'rule.level',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'rule.description',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

export const getVisStateOfficeUserOperationLevel = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-Office-User-Operation-Level-Table',
    title: 'User Operations',
    type: 'table',
    params: {
      perPage: 5,
      showPartialRows: false,
      showMetricsAtAllLevels: false,
      sort: {
        columnIndex: null,
        direction: null,
      },
      showTotal: false,
      totalFunc: 'sum',
      percentageCol: '',
    },
    uiState: {
      vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
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
            field: 'data.office365.UserId',
            orderBy: '1',
            order: 'desc',
            size: 500,
            otherBucket: true,
            otherBucketLabel: 'Others',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Users',
          },
          schema: 'bucket',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.office365.Operation',
            orderBy: '1',
            order: 'desc',
            size: 100,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Operation',
          },
          schema: 'bucket',
        },
        {
          id: '4',
          enabled: true,
          type: 'terms',
          params: {
            field: 'rule.level',
            orderBy: '1',
            order: 'desc',
            size: 20,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Rule level',
          },
          schema: 'bucket',
        },
      ],
    },
  };
};

export const getVisStateOfficeAlertsEvolutionByUser = (
  indexPatternId: string,
) => {
  return {
    id: 'Wazuh-App-Overview-Office-Alerts-Evolution-By-User',
    title: 'Alerts evolution over time',
    type: 'line',
    params: {
      type: 'line',
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
            type: 'linear',
            mode: 'normal',
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: 'Count',
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            label: 'Count',
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: true,
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
      vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
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
            field: 'timestamp',
            timeRange: {
              from: 'now-1y',
              to: 'now',
            },
            useNormalizedEsInterval: true,
            scaleMetricValues: false,
            interval: 'h',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.office365.Actor.ID',
            orderBy: '1',
            order: 'asc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getVisStateTopOfficeUsers = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-Office-Top-Users',
    title: 'Top Office Users',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: {
        show: false,
        values: true,
        last_level: true,
        truncate: 100,
      },
    },
    uiState: {
      vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
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
            field: 'data.office365.UserId',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

export const getVisStateOfficeCountryTagCloud = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-Office-Country-Tag-Cloud',
    title: 'Country of origin',
    type: 'tagcloud',
    params: {
      scale: 'linear',
      orientation: 'right angled',
      minFontSize: 18,
      maxFontSize: 72,
      showLabel: false,
    },
    uiState: {
      vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
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
            field: 'GeoLocation.country_name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

export const getVisStateOfficeAlertsEvolutionByUserID = (
  indexPatternId: string,
) => {
  return {
    id: 'Wazuh-App-Overview-Office-Alerts-Evolution-By-UserID',
    title: 'Alerts by user',
    type: 'line',
    params: {
      type: 'line',
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
            type: 'linear',
            mode: 'normal',
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: 'Alerts',
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            label: 'Alerts',
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: true,
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
      row: true,
    },
    uiState: {
      vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
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
            customLabel: 'Alerts',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          params: {
            field: 'timestamp',
            timeRange: {
              from: 'now-1w',
              to: 'now',
            },
            useNormalizedEsInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.office365.UserId',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'User ID',
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getVisStateOfficeTopOperations = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-Office-Top-Operations',
    title: 'Top Operations',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: {
        show: false,
        values: true,
        last_level: true,
        truncate: 100,
      },
    },
    uiState: {
      vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
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
            field: 'data.office365.Operation',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Operation',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

export const getVisStateOfficeClientIPOperationLevelTable = (
  indexPatternId: string,
) => {
  return {
    id: 'Wazuh-App-Overview-Office-Client-IP-Operation-Level-Table',
    title: 'Client IP Operations',
    type: 'table',
    params: {
      perPage: 5,
      showPartialRows: false,
      showMetricsAtAllLevels: false,
      sort: {
        columnIndex: null,
        direction: null,
      },
      showTotal: false,
      totalFunc: 'sum',
      percentageCol: '',
    },
    uiState: {
      vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
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
            field: 'data.office365.ClientIP',
            orderBy: '1',
            order: 'desc',
            size: 500,
            otherBucket: true,
            otherBucketLabel: 'Others',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Client IP address',
          },
          schema: 'bucket',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.office365.Operation',
            orderBy: '1',
            order: 'desc',
            size: 100,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Operation',
          },
          schema: 'bucket',
        },
        {
          id: '4',
          enabled: true,
          type: 'terms',
          params: {
            field: 'rule.level',
            orderBy: '1',
            order: 'desc',
            size: 20,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Rule level',
          },
          schema: 'bucket',
        },
      ],
    },
  };
};
