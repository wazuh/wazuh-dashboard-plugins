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

import { uiModules } from 'ui/modules';
import { GroupsController } from './groups';
import { ConfigurationController } from './configuration';
import { DecodersController } from './decoders';
import { LogsController } from './logs';
import { ManagementController } from './management';
import { RulesController } from './rules';
import { StatusController } from './status';

const app = uiModules.get('app/wazuh', []);

app
  .controller('managementController', ManagementController)
  .controller('managementConfigurationController', ConfigurationController)
  .controller('decodersController', DecodersController)
  .controller('groupsPreviewController', GroupsController)
  .controller('managerLogController', LogsController)
  .controller('rulesController', RulesController)
  .controller('managerStatusController', StatusController);
