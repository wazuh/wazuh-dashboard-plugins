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
import { log } from './server/logger';

export function initApp(server) {
  const monitoringInstance = new Monitoring(server);
  log('[initApp]', `Waiting for awaitMigration()`, 'info');
  server.kibanaMigrator
    .awaitMigration()
    .then(() => {
      log(
        '[initApp]',
        `awaitMigration() has been executed successfully`,
        'info'
      );
      Initialize(server);
      WazuhElasticRouter(server);
      WazuhApiElasticRoutes(server);
      monitoringInstance.run();
      WazuhApiRoutes(server);
      WazuhReportingRoutes(server);
      WazuhUtilsRoutes(server);
    })
    .catch(error => {
      log(
        '[initApp]',
        `initApp function failed due to: ${error.message || error}`
      );
    });
}
