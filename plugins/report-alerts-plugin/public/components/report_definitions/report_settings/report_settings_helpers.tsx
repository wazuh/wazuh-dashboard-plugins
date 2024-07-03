/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const parseInContextUrl = (url: string, parameter: string) => {
  const info = url.split('?');
  if (parameter === 'id') {
    return info[1].substring(info[1].indexOf(':') + 1, info[1].length);
  } else if (parameter === 'timeFrom') {
    return info[2].substring(info[2].indexOf('=') + 1, info[2].length);
  } else if (parameter === 'timeTo') {
    return info[3].substring(info[3].indexOf('=') + 1, info[3].length);
  }
  return 'error: invalid parameter';
};

export const getDashboardBaseUrlCreate = (
  edit: boolean,
  editDefinitionId: string,
  fromInContext: boolean
) => {
  let baseUrl;
  if (!fromInContext) {
    baseUrl = location.pathname + location.hash;
  } else {
    baseUrl = '/app/dashboards#/view/';
  }
  if (edit) {
    return baseUrl.replace(
      `reports-alerts#/edit/${editDefinitionId}`,
      'dashboards#/view/'
    );
  } else if (fromInContext) {
    return baseUrl;
  }
  return baseUrl.replace('reports-alerts#/create', 'dashboards#/view/');
};

export const getVisualizationBaseUrlCreate = (
  edit: boolean,
  editDefinitionId: string,
  fromInContext: boolean
) => {
  let baseUrl;
  if (!fromInContext) {
    baseUrl = location.pathname + location.hash;
  } else {
    baseUrl = '/app/visualize#/edit/';
  }
  if (edit) {
    return baseUrl.replace(
      `reports-alerts#/edit/${editDefinitionId}`,
      'visualize#/edit/'
    );
  } else if (fromInContext) {
    return baseUrl;
  }
  return baseUrl.replace('reports-alerts#/create', 'visualize#/edit/');
};

export const getSavedSearchBaseUrlCreate = (
  edit: boolean,
  editDefinitionId: string,
  fromInContext: boolean
) => {
  let baseUrl;
  if (!fromInContext) {
    baseUrl = location.pathname + location.hash;
  } else {
    baseUrl = '/app/discover#/view/';
  }
  if (edit) {
    return baseUrl.replace(
      `reports-alerts#/edit/${editDefinitionId}`,
      'discover#/view/'
    );
  } else if (fromInContext) {
    return baseUrl;
  }
  return baseUrl.replace('reports-alerts#/create', 'discover#/view/');
};

export const getNotebooksBaseUrlCreate = (
  edit: boolean,
  editDefinitionId: string,
  fromInContext: boolean
) => {
  let baseUrl;
  if (!fromInContext) {
    baseUrl = location.pathname + location.hash;
  } else {
    baseUrl = '/app/notebooks-dashboards?view=output_only#/';
  }
  if (edit) {
    return baseUrl.replace(
      `reports-alerts#/edit/${editDefinitionId}`,
      'notebooks-dashboards?view=output_only#/'
    );
  } else if (fromInContext) {
    return baseUrl;
  }
  return baseUrl.replace(
    'reports-alerts#/create',
    'notebooks-dashboards?view=output_only#/'
  );
};

export const getDashboardOptions = (data: string | any[]) => {
  let index;
  let dashboard_options = [];
  for (index = 0; index < data.length; ++index) {
    let entry = {
      value: data[index]['_id'].substring(10),
      label: data[index]['_source']['dashboard']['title'],
    };
    dashboard_options.push(entry);
  }
  return dashboard_options;
};

export const getVisualizationOptions = (data: string | any[]) => {
  let index;
  let options = [];
  for (index = 0; index < data.length; ++index) {
    let entry = {
      value: data[index]['_id'].substring(14),
      label: data[index]['_source']['visualization']['title'],
    };
    options.push(entry);
  }
  return options;
};

export const getSavedSearchOptions = (data: string | any[]) => {
  let index;
  let options = [];
  for (index = 0; index < data.length; ++index) {
    let entry = {
      value: data[index]['_id'].substring(7),
      label: data[index]['_source']['search']['title'],
    };
    options.push(entry);
  }
  return options;
};

export const getNotebooksOptions = (data: any) => {
  let index;
  let options = [];
  for (index = 0; index < data.length; ++index) {
    let entry = {
      value: data[index]['id'],
      label: data[index]['path'],
    };
    options.push(entry);
  }
  return options;
};

export const handleDataToVisualReportSourceChange = (
  reportDefinitionRequest
) => {
  delete reportDefinitionRequest.report_params.core_params.saved_search_id;
  delete reportDefinitionRequest.report_params.core_params.limit;
  delete reportDefinitionRequest.report_params.core_params.excel;
  reportDefinitionRequest.report_params.core_params.report_format = 'pdf';
};

export const getReportSourceFromURL = (url: string) => {
  const source = url.split('?')[1].match(/previous=(.*):/);
  return source![1];
};
