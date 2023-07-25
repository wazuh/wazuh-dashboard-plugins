/*
 * Wazuh app - Load the Agent controllers and React components.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { AgentsPreviewController } from './agents-preview';
import { AgentsController } from './agents';
import { RegisterAgent } from './components/register-agent';
import { ExportConfiguration } from './components/export-configuration';
import { AgentsWelcome } from '../../components/common/welcome/agents-welcome';
import { Mitre } from '../../components/overview'
import { AgentsPreview } from './components/agents-preview';
import { AgentsTable } from './components/agents-table';
import { MainModule } from '../../components/common/modules/main';
import { MainSyscollector } from '../../components/agents/syscollector/main';
import { MainAgentStats } from '../../components/agents/stats';
import { getAngularModule } from '../../kibana-services';

const app = getAngularModule();

app
  .controller('agentsController', AgentsController)
  .controller('agentsPreviewController', AgentsPreviewController)
  .value('RegisterAgent', RegisterAgent)
  .value('ExportConfiguration', ExportConfiguration)
  .value('AgentsWelcome', AgentsWelcome)
  .value('AgentsPreview', AgentsPreview)
  .value('Mitre', Mitre)
  .value('AgentsTable', AgentsTable)
  .value('MainSyscollector', MainSyscollector)
  .value('MainAgentStats', MainAgentStats)
  .value('MainModule', MainModule);
