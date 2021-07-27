import React from 'react';
import { OfficeBody, OfficeDrilldown } from '../views';
import { MainViewConfig, DrilldownConfig } from './';


export const ModuleConfig = {
  main: {
    length: () => MainViewConfig.rows.reduce((total, row) => total + row.columns.length, 0),
    component: (props) => <OfficeBody {...{ ...MainViewConfig, ...props }} />
  },
  drilldown: {
    length: () => DrilldownConfig.rows.reduce((total, row) => total + row.columns.length, 0),
    component: (props) => <OfficeDrilldown {...{ ...DrilldownConfig, ...props }} />
  }
};
