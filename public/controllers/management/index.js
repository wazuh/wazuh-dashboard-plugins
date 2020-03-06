/*
 * Wazuh app - Load all the Management controllers and related React components.
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import { ClusterController } from './monitoring';
import { StatisticsController } from './statistics';
import { CdbListsController } from './cdblists';
import { ConfigurationRulesetController } from './config-ruleset';
import { ConfigurationGroupsController } from './config-groups';
import { EditionController } from './edition';
import { FilesController } from './files';
import { WelcomeScreen } from './components/management-welcome';
import { WelcomeWrapper } from './components/welcome-wrapper';
import { FilesInGroupTable } from './components/files-group-table';
import { GroupsTable } from './components/management/groups/groups-table';
import { UploadFiles } from './components/upload-files';
import WzRuleset from './components/management/ruleset/main-ruleset';
import WzManagement from './components/management/management-provider';
import WzManagementMain from './components/management/management-main';
import { ExportConfiguration } from '../agent/components/export-configuration';
import WzManagementConfiguration from './components/management/configuration/configuration-main';

const app = uiModules.get('app/wazuh', []);

app
  .controller('managementController', ManagementController)
  // .controller('managementConfigurationController', ConfigurationController)
  .controller('decodersController', DecodersController)
  .controller('groupsPreviewController', GroupsController)
  .controller('managerLogController', LogsController)
  .controller('rulesController', RulesController)
  .controller('clusterController', ClusterController)
  .controller('cdbListsController', CdbListsController)
  .controller('configurationRulesetController', ConfigurationRulesetController)
  .controller('configurationGroupsController', ConfigurationGroupsController)
  .controller('editionController', EditionController)
  .controller('filesController', FilesController)
  .controller('statisticsController', StatisticsController)
  .value('WelcomeScreenManagement', WelcomeScreen)
  .value('WelcomeWrapper', WelcomeWrapper)
  .value('UploadFiles', UploadFiles)
  .value('WzRuleset', WzRuleset)
  .value('WzManagement', WzManagement)
  .value('WzManagementMain', WzManagementMain)
  .value('GroupsTable', GroupsTable)
  .value('ExportConfiguration', ExportConfiguration)
  .value('FilesInGroupTable', FilesInGroupTable)
  .value('UploadFiles', UploadFiles)
  .value('WzManagementConfiguration', WzManagementConfiguration);