import { WzRequest } from '../wz-request';
import {
  DashboardGenerateReport,
  DASHBOARDS_GENERATE_REPORTS,
} from './dashboards-generate-reports';
import { htmlTemplate } from './html-template';

export class reportingDefinitions {
  /**
   * Create report body */
  static createReportDefinitionBody(dashboardId: string) {
    const dashboard: DashboardGenerateReport =
      DASHBOARDS_GENERATE_REPORTS.filter(
        ({ idDashboardByReference }) => idDashboardByReference === dashboardId,
      )[0];
    return {
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
    };
  }

  /**
   * Create report */
  static async createReportDefinition(dashboardId: string) {
    try {
      const postReport = await WzRequest.genericReq(
        'POST',
        '/api/reporting/reportDefinition',
        this.createReportDefinitionBody(dashboardId),
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

      const reportDefinitionNoExist = reportsDefinitionsList?.every(report => {
        const splitUrl =
          report?._source?.report_definition?.report_params?.core_params?.base_url.split(
            '/',
          );
        return splitUrl[splitUrl.length - 1] !== dashboardId;
      });

      if (!reportDefinitionNoExist) {
        return;
      }

      await this.createReportDefinition(dashboardId);
    } catch (error) {
      throw error?.data?.message || false
        ? new Error(error.data.message)
        : error;
    }
  }

  /**
   * Override the report */
  static async overrideReportDefinition(dashboardId: string) {
    try {
      const {
        data: { data: reportsDefinitionsList },
      } = await this.getReportDefinitions();

      const reportDefinition = reportsDefinitionsList?.find(report => {
        const splitUrl =
          report?._source?.report_definition?.report_params?.core_params?.base_url.split(
            '/',
          );
        return splitUrl[splitUrl.length - 1] === dashboardId;
      });

      if (!reportDefinition) {
        const reportDefinitionCreated = await this.createReportDefinition(
          dashboardId,
        );
        return reportDefinitionCreated;
      }

      const reportDefinitionEdited = await WzRequest.genericReq(
        'PUT',
        `/api/reporting/reportDefinitions/${reportDefinition._id}`,
        this.createReportDefinitionBody(dashboardId),
      );

      return reportDefinitionEdited;
    } catch (error) {
      throw error?.data?.message || false
        ? new Error(error.data.message)
        : error;
    }
  }
}
