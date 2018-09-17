/*
 * Wazuh app - File for app requirements and set up
 * Copyright (C) 2018 Wazuh, Inc.
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
import { ApiRequest } from './api-request';
import { GenericRequest } from './generic-request';
import { AppState } from './app-state';
import { ApiTester } from './api-tester';
import { PatternHandler } from './pattern-handler';
import './routes';
import { CSVRequest } from './csv-request';
import { CommonData } from './common-data';
import { ReportingService } from './reporting';
import { VisFactoryService } from './vis-factory-handler';
import './region-maps';
import './order-object-by';
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

app
  .service('errorHandler', ErrorHandler)
  .service('apiReq', ApiRequest)
  .service('genericReq', GenericRequest)
  .service('appState', AppState)
  .service('testAPI', ApiTester)
  .service('patternHandler', PatternHandler)
  .service('csvReq', CSVRequest)
  .service('commonData', CommonData)
  .service('reportingService', ReportingService)
  .service('visFactoryService', VisFactoryService);
