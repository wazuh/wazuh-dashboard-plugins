/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OPENSEARCH_REPORTS_API } from '../../common';

export default function (Client: any, config: any, components: any) {
  const clientAction = components.clientAction.factory;

  Client.prototype.opensearch_reports = components.clientAction.namespaceFactory();
  const opensearchReports = Client.prototype.opensearch_reports.prototype;

  /**
   * report related APIs
   */
  opensearchReports.createReport = clientAction({
    url: {
      fmt: `${OPENSEARCH_REPORTS_API.ON_DEMAND_REPORT}`,
    },
    method: 'PUT',
    needBody: true,
  });

  opensearchReports.createReportFromDefinition = clientAction({
    url: {
      fmt: `${OPENSEARCH_REPORTS_API.ON_DEMAND_REPORT}/<%=reportDefinitionId%>`,
      req: {
        reportDefinitionId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'POST',
    needBody: true,
  });

  opensearchReports.updateReportInstanceStatus = clientAction({
    url: {
      fmt: `${OPENSEARCH_REPORTS_API.REPORT_INSTANCE}/<%=reportInstanceId%>`,
      req: {
        reportInstanceId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'POST',
    needBody: true,
  });

  opensearchReports.getReportById = clientAction({
    url: {
      fmt: `${OPENSEARCH_REPORTS_API.REPORT_INSTANCE}/<%=reportInstanceId%>`,
      req: {
        reportInstanceId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  opensearchReports.getReports = clientAction({
    url: {
      fmt: `${OPENSEARCH_REPORTS_API.LIST_REPORT_INSTANCES}`,
      params: {
        fromIndex: {
          type: 'number',
        },
        maxItems: {
          type: 'number',
        },
      },
    },
    method: 'GET',
  });

  /**
   * report definition related APIs
   */
  opensearchReports.createReportDefinition = clientAction({
    url: {
      fmt: `${OPENSEARCH_REPORTS_API.REPORT_DEFINITION}`,
    },
    method: 'POST',
    needBody: true,
  });

  opensearchReports.updateReportDefinitionById = clientAction({
    url: {
      fmt: `${OPENSEARCH_REPORTS_API.REPORT_DEFINITION}/<%=reportDefinitionId%>`,
      req: {
        reportDefinitionId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'PUT',
    needBody: true,
  });

  opensearchReports.getReportDefinitionById = clientAction({
    url: {
      fmt: `${OPENSEARCH_REPORTS_API.REPORT_DEFINITION}/<%=reportDefinitionId%>`,
      req: {
        reportDefinitionId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  opensearchReports.getReportDefinitions = clientAction({
    url: {
      fmt: `${OPENSEARCH_REPORTS_API.LIST_REPORT_DEFINITIONS}`,
      params: {
        fromIndex: {
          type: 'number',
        },
        maxItems: {
          type: 'number',
        },
      },
    },
    method: 'GET',
  });

  opensearchReports.deleteReportDefinitionById = clientAction({
    url: {
      fmt: `${OPENSEARCH_REPORTS_API.REPORT_DEFINITION}/<%=reportDefinitionId%>`,
      req: {
        reportDefinitionId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });
}
