import React from 'react';
import { DashboardPage } from './dashboard';

export function createMetricsDashboard(core, plugins) {
  return (props) => {
    return (
      <DashboardPage {...props} core={core} plugins={plugins}/>
    )
  }
}
