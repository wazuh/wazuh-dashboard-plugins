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
module.exports = (server, options) => {
    require('./server/initialize')(server, options);
    require('./server/routes/wazuh-elastic')(server, options);
    require('./server/routes/wazuh-api-elastic')(server, options);
    require('./server/monitoring')(server, options);
    require('./server/vis-deletion-cron')(server);
    require('./server/routes/wazuh-api')(server, options);
};
