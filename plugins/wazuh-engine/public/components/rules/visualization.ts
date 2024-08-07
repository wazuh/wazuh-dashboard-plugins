const getVisualization = (indexPatternId: string, ruleID: string) => {
  return {
    id: 'Wazuh-rules-vega',
    title: `Child rules of ${ruleID}`,
    type: 'vega',
    params: {
      spec: `{\n  $schema: https://vega.github.io/schema/vega/v5.json\n  description: An example of Cartesian layouts for a node-link diagram of hierarchical data.\n  padding: 5\n  signals: [\n    {\n      name: labels\n      value: true\n      bind: {\n        input: checkbox\n      }\n    }\n    {\n      name: layout\n      value: tidy\n      bind: {\n        input: radio\n        options: [\n          tidy\n          cluster\n        ]\n      }\n    }\n    {\n      name: links\n      value: diagonal\n      bind: {\n        input: select\n        options: [\n          line\n          curve\n          diagonal\n          orthogonal\n        ]\n      }\n    }\n    {\n      name: separation\n      value: false\n      bind: {\n        input: checkbox\n      }\n    }\n  ]\n  data: [\n    {\n      name: tree\n      url: {\n      /*\n      An object instead of a string for the "url" param is treated as an OpenSearch query. Anything inside this object is not part of the Vega language, but only understood by OpenSearch Dashboards and OpenSearch server. This query counts the number of documents per time interval, assuming you have a @timestamp field in your data.\n\n      OpenSearch Dashboards has a special handling for the fields surrounded by "%".  They are processed before the the query is sent to OpenSearch. This way the query becomes context aware, and can use the time range and the dashboard filters.\n      */\n\n      // Apply dashboard context filters when set\n      // %context%: true\n      // Filter the time picker (upper right corner) with this field\n      // %timefield%: @timestamp\n\n      /*\n      See .search() documentation for :  https://opensearch.org/docs/latest/clients/javascript/\n      */\n\n      // Which index to search\n        index: wazuh-rules\n\n\n      // If "data_source.enabled: true", optionally set the data source name to query from (omit field if querying from local cluster)\n      // data_source_name: Example US Cluster\n\n      // Aggregate data by the time field into time buckets, counting the number of documents in each bucket.\n        body: {\n          query: {\n            bool: {\n              should: [\n                {\n                  match_phrase: {\n                    name: ${ruleID}\n                  }\n                }\n                {\n                  match_phrase: {\n                    parents: ${ruleID}\n                  }\n                }\n              ]\n              minimum_should_match: 1\n            }\n          }\n          /* query: {\n            match_all: {\n            }\n          } */\n          size: 1000\n        }\n      }\n    /*\n    OpenSearch will return results in this format:\n\n    aggregations: {\n      time_buckets: {\n        buckets: [\n          {\n            key_as_string: 2015-11-30T22:00:00.000Z\n            key: 1448920800000\n            doc_count: 0\n          },\n          {\n            key_as_string: 2015-11-30T23:00:00.000Z\n            key: 1448924400000\n            doc_count: 0\n          }\n          ...\n        ]\n      }\n    }\n\n    For our graph, we only need the list of bucket values.  Use the format.property to discard everything else.\n    */\n      format: {\n        property: hits.hits\n      }\n      transform: [\n        {\n          type: stratify\n          key: _source.id\n          parentKey: _source.parents\n        }\n        {\n          type: tree\n          method: {\n            signal: layout\n          }\n          size: [\n            {\n              signal: height\n            }\n            {\n              signal: width - 100\n            }\n          ]\n          separation: {\n            signal: separation\n          }\n          as: [\n            y\n            x\n            depth\n            children\n          ]\n        }\n      ]\n    }\n    {\n      name: links\n      source: tree\n      transform: [\n        {\n          type: treelinks\n        }\n        {\n          type: linkpath\n          orient: horizontal\n          shape: {\n            signal: links\n          }\n        }\n      ]\n    }\n  ]\n  scales: [\n    {\n      name: color\n      type: linear\n      range: {\n        scheme: magma\n      }\n      domain: {\n        data: tree\n        field: depth\n      }\n      zero: true\n    }\n  ]\n  marks: [\n    {\n      type: path\n      from: {\n        data: links\n      }\n      encode: {\n        update: {\n          path: {\n            field: path\n          }\n          stroke: {\n            value: "#ccc"\n          }\n        }\n      }\n    }\n    {\n      type: symbol\n      from: {\n        data: tree\n      }\n      encode: {\n        enter: {\n          size: {\n            value: 100\n          }\n          stroke: {\n            value: "#fff"\n          }\n        }\n        update: {\n          x: {\n            field: x\n          }\n          y: {\n            field: y\n          }\n          fill: {\n            scale: color\n            field: depth\n          }\n        }\n      }\n    }\n    {\n      type: text\n      from: {\n        data: tree\n      }\n      encode: {\n        enter: {\n          text: {\n            field: _source.id\n          }\n          fontSize: {\n            value: 15\n          }\n          baseline: {\n            value: middle\n          }\n        }\n        update: {\n          x: {\n            field: x\n          }\n          y: {\n            field: y\n          }\n          dx: {\n            signal: datum.children ? -7 : 7\n          }\n          align: {\n            signal: datum.children ? \'right\' : \'left\'\n          }\n          opacity: {\n            signal: labels ? 1 : 0\n          }\n        }\n      }\n    }\n  ]\n}`,
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
      aggs: [],
    },
  };
};

export const getDashboard = (
  indexPatternId: string,
  ruleID: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    ruleVis: {
      gridData: {
        w: 42,
        h: 12,
        x: 0,
        y: 0,
        i: 'ruleVis',
      },
      type: 'visualization',
      explicitInput: {
        id: 'ruleVis',
        savedVis: getVisualization(indexPatternId, ruleID),
      },
    },
  };
};
