import React from 'react';
import { OfficeBody, OfficeDrilldown } from '../views';
import { MainViewConfig, DrilldownUserConfig, DrilldownIPConfig } from './';


export const ModuleConfig = {
  main: {
    length: () => MainViewConfig.rows.reduce((total, row) => total + row.columns.length, 0),
    component: (props) => <OfficeBody {...{ ...MainViewConfig, ...props }} />
  },
  'data.office365.UserId': {
    length: () => DrilldownUserConfig.rows.reduce((total, row) => total + row.columns.length, 0),
    component: (props) => <OfficeDrilldown title={"User Activity"} {...{ ...DrilldownUserConfig, ...props }} />
  },
  'data.office365.ClientIP': {
    length: () => DrilldownIPConfig.rows.reduce((total, row) => total + row.columns.length, 0),
    component: (props) => <OfficeDrilldown title={"Client IP"} {...{ ...DrilldownIPConfig, ...props }} />
  },
};
