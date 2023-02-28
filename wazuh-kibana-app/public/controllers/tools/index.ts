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
import { ToolsController } from './tools';
import { getAngularModule } from '../../kibana-services';
import { Logtest } from '../../directives/wz-logtest/components/logtest';
import { DevToolsController } from '../dev-tools/dev-tools';

const app = getAngularModule();

Logtest.displayName = 'Logtest';
app
  .controller('devToolsController', DevToolsController)
  .controller('toolsController', ToolsController)
  .value('Logtest', Logtest);
