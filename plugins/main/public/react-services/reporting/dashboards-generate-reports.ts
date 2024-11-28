export interface DashboardGenerateReport {
  idDashboardByReference: string;
  titleReport: string;
}

export const vulnerabilityDetectionDashboardReport: DashboardGenerateReport = {
  idDashboardByReference: '94febc80-55a2-11ef-a580-5b5ba88681be',
  titleReport: 'Vulnerability Detection Dashboard Report',
};

export const DASHBOARDS_GENERATE_REPORTS: Array<DashboardGenerateReport> = [
  vulnerabilityDetectionDashboardReport,
];
