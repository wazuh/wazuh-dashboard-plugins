/*
 * Wazuh app - Module for server initialization
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import { Monitoring } from './server/monitoring';
import { WazuhApiRoutes } from './server/routes/wazuh-api';
import { WazuhHostsRoutes } from './server/routes/wazuh-hosts';
import { WazuhReportingRoutes } from './server/routes/wazuh-reporting';
import { WazuhUtilsRoutes } from './server/routes/wazuh-utils';
import { SchedulerHandler } from './server/lib/cron-scheduler'
import { log } from './server/logger';
import { Queue } from './server/jobs/queue';

export function initApp(server) {
  const monitoringInstance = new Monitoring(server);
  const schedulerHandler = new SchedulerHandler(server);
  log('init:initApp', `Waiting for Kibana migration jobs`, 'debug');
  server.kibanaMigrator
    .runMigrations()
    .then(() => {
      log(
        'init:initApp',
        `Kibana migration jobs executed successfully`,
        'debug'
      );
      Initialize(server);
      WazuhElasticRouter(server);
      monitoringInstance.run();
      schedulerHandler.run();
      Queue.launchCronJob();
      WazuhApiRoutes(server);
      WazuhHostsRoutes(server);
      WazuhReportingRoutes(server);
      WazuhUtilsRoutes(server);
    })
    .catch(error => {
      log('init:initApp', error.message || error);
    });
}
