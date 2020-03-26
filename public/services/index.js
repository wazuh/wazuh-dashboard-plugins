/*
 * Wazuh app - Load all the Angular.js services.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { ErrorHandler } from './error-handler';
import './theming';
import { PatternHandler } from './pattern-handler';
import './routes';
import { CSVRequest } from './csv-request';
import { CommonData } from './common-data';
import { ReportingService } from './reporting';
import { VisFactoryService } from './vis-factory-handler';
import './region-maps';
import './order-object-by';
import { uiModules } from 'ui/modules';
import { GroupHandler } from './group-handler';
import { RulesetHandler } from './ruleset-handler';
import { ConfigHandler } from './config-handler';
import { TimeService } from './time-service';
import { CheckDaemonsStatus } from './check-daemon-status';

const app = uiModules.get('app/wazuh', []);

app
  .service('errorHandler', ErrorHandler)
  .service('patternHandler', PatternHandler)
  .service('csvReq', CSVRequest)
  .service('commonData', CommonData)
  .service('reportingService', ReportingService)
  .service('visFactoryService', VisFactoryService)
  .service('groupHandler', GroupHandler)
  .service('rulesetHandler', RulesetHandler)
  .service('configHandler', ConfigHandler)
  .service('timeService', TimeService)
  .service('checkDaemonsStatus', CheckDaemonsStatus);
