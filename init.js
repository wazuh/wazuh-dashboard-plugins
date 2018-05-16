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
import initialize      from './server/initialize';
import wazuhElastic    from './server/routes/wazuh-elastic';
import wazuhApiElastic from './server/routes/wazuh-api-elastic';
import monitoring      from './server/monitoring';
import wazuhApi        from './server/routes/wazuh-api';

export default (server, options) => {
    initialize(server, options);
    wazuhElastic(server, options);
    wazuhApiElastic(server, options);
    monitoring(server, false);
    wazuhApi(server, options);
};
