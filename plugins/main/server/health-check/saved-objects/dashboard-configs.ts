import type { DashboardByRendererConfig } from "../../../common/dashboards/dashboard-builder";
import { WelcomeDashboardByRendererConfig } from '../../../common/dashboards/welcome/dashboard';
import { INDEX_PATTERN_REPLACE_ME } from './constants';

export const getDashboardConfigs = (): DashboardByRendererConfig[] => {
  const welcomeDashboardConfig = new WelcomeDashboardByRendererConfig(
    INDEX_PATTERN_REPLACE_ME,
  );

  return [welcomeDashboardConfig];
};
