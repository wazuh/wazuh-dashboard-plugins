import { SavedObject } from '../saved-objects';
import { WzRequest } from '../wz-request';
import {
  DashboardGenerateReport,
  DASHBOARDS_GENERATE_REPORTS,
} from './dashboards-generate-reports';
import { htmlTemplate } from './html-template';

export class reportingDefinitions {
  /**
   * Create report */
  static async createReportDefinition(dashboard: DashboardGenerateReport) {
    try {
      const postReport = await WzRequest.genericReq(
        'POST',
        '/api/reporting/reportDefinition',
        {
          report_params: {
            report_name: dashboard.titleReport,
            report_source: 'Dashboard',
            description: '',
            core_params: {
              base_url: `/app/dashboards#/view/${dashboard.idDashboardByReference}`,
              report_format: 'pdf',
              time_duration: 'PT30M',
            },
          },
          delivery: {
            configIds: [],
            title: dashboard.titleReport,
            textDescription: htmlTemplate,
            htmlDescription: htmlTemplate,
          },
          trigger: {
            trigger_type: 'Schedule',
            trigger_params: {
              enabled_time: 1728473660771,
              schedule: {
                interval: {
                  period: 1,
                  unit: 'DAYS',
                  start_time: 1728473700000,
                },
              },
              schedule_type: 'Recurring',
              enabled: false,
            },
          },
        },
      );
      return postReport;
    } catch (error) {
      throw error?.data?.message || false
        ? new Error(error.data.message)
        : error;
    }
  }

  /**
   * Get report */
  static async getReportDefinitions() {
    try {
      const getReport = await WzRequest.genericReq(
        'GET',
        '/api/reporting/reportDefinitions',
      );
      return getReport;
    } catch (error) {
      throw error?.data?.message || false
        ? new Error(error.data.message)
        : error;
    }
  }

  /**
   * Validate if the report exists
   * If the report does not exist, it is created */
  static async validateIfReportDefinitionExist(dashboardId: string) {
    try {
      const {
        data: { data: reportsDefinitionsList },
      } = await this.getReportDefinitions();

      const reportDefinitionNoExist = reportsDefinitionsList?.every(
        report =>
          report?.report_definition?.report_params?.report_name !== dashboardId,
      );

      if (!reportDefinitionNoExist) {
        return;
      }

      const dashboard = DASHBOARDS_GENERATE_REPORTS.filter(
        ({ idDashboardByReference }) => idDashboardByReference === dashboardId,
      )[0];

      await this.createReportDefinition(dashboard);
    } catch (error) {
      throw error?.data?.message || false
        ? new Error(error.data.message)
        : error;
    }
  }
}
