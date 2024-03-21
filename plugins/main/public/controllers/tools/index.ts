/*
 * Wazuh app - Load the Dev Tools controller.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { getAngularModule } from '../../kibana-services';
import { Logtest } from '../../directives/wz-logtest/components/logtest';

import { ToolsRouter } from '../../components/tools/tools-router';

const app = getAngularModule();

Logtest.displayName = 'Logtest';
app.value('ToolsRouter', ToolsRouter).value('Logtest', Logtest);
