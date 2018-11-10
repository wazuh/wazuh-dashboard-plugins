/*
 * Wazuh app - Module for server initialization
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Imports all server modules
import { Initialize } from './server/initialize';
import { WazuhElasticRouter } from './server/routes/wazuh-elastic';
import { WazuhApiElasticRoutes } from './server/routes/wazuh-api-elastic';
import { Monitoring } from './server/monitoring';
import { WazuhApiRoutes } from './server/routes/wazuh-api';
import { WazuhReportingRoutes } from './server/routes/wazuh-reporting';
import { WazuhUtilsRoutes } from './server/routes/wazuh-utils';

export function initApp(server) {
  Initialize(server);
  WazuhElasticRouter(server);
  WazuhApiElasticRoutes(server);
  Monitoring(server, false);
  WazuhApiRoutes(server);
  WazuhReportingRoutes(server);
  WazuhUtilsRoutes(server);
}
