/*
 * Wazuh app - Load all the Management controllers and related React components.
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
import { ClusterController } from './monitoring';
import { CdbListsController } from './cdblists';
import { ConfigurationRulesetController } from './config-ruleset';
import { ConfigurationGroupsController } from './config-groups';
import { EditionController } from './edition';
import { FilesController } from './files';
import { WelcomeScreen } from './components/welcome';
import { ReportingTable } from './components/reporting-table';

const app = uiModules.get('app/wazuh', []);

app
  .controller('managementController', ManagementController)
  .controller('managementConfigurationController', ConfigurationController)
  .controller('decodersController', DecodersController)
  .controller('groupsPreviewController', GroupsController)
  .controller('managerLogController', LogsController)
  .controller('rulesController', RulesController)
  .controller('managerStatusController', StatusController)
  .controller('clusterController', ClusterController)
  .controller('cdbListsController', CdbListsController)
  .controller('configurationRulesetController', ConfigurationRulesetController)
  .controller('configurationGroupsController', ConfigurationGroupsController)
  .controller('editionController', EditionController)
  .controller('filesController', FilesController)
  .value('WelcomeScreenManagement', WelcomeScreen)
  .value('ReportingTable', ReportingTable);
