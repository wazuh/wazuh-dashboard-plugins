/*
 * Wazuh app - Load all the Angular.js services.
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import './routes';
import { CSVRequest } from './csv-request';
import { CommonData } from './common-data';
import { ReportingService } from './reporting';
import { VisFactoryService } from './vis-factory-handler';
import './region-maps';
import './order-object-by';
import { ConfigHandler } from './config-handler';
import { CheckDaemonsStatus } from './check-daemon-status';
import { getAngularModule } from '../kibana-services';

const app = getAngularModule();

app
  .service('errorHandler', ErrorHandler)
  .service('csvReq', CSVRequest)
  .service('commonData', CommonData)
  .service('reportingService', ReportingService)
  .service('visFactoryService', VisFactoryService)
  .service('configHandler', ConfigHandler)
  .service('checkDaemonsStatus', CheckDaemonsStatus);
