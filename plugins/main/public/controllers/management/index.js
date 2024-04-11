/*
 * Wazuh app - Load all the Management controllers and related React components.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ManagementController } from './management';
import { ClusterController } from './monitoring';
import WzManagement from './components/management/management-provider';
import WzManagementConfiguration from './components/management/configuration/configuration-main';
import { getAngularModule } from '../../kibana-services';

const app = getAngularModule();

WzManagement.displayName = 'WzManagement';
WzManagementConfiguration.displayName = 'WzManagementConfiguration';

app
  .controller('managementController', ManagementController)
  .controller('clusterController', ClusterController)
  .value('WzManagement', WzManagement)
  .value('WzManagementConfiguration', WzManagementConfiguration);
