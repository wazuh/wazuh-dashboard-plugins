/*
 * Wazuh app - React component for building Analysisd dashboard
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from 'react';
import { useBuildStatisticsVisualizations } from './hooks';
import { DashboardAnalysisEngineStatistics } from '../../../../../components/overview/server-management-statistics/dashboards/dashboard_analysis_engine';

export function WzStatisticsAnalysisd({
  isClusterMode,
  clusterNodeSelected,
  refreshVisualizations,
}) {
  useBuildStatisticsVisualizations(clusterNodeSelected, refreshVisualizations);

  return <DashboardAnalysisEngineStatistics isClusterMode={isClusterMode} />;
}
