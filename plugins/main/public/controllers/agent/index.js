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
import { AgentsController } from './agents';
import { RegisterAgent } from '../../components/endpoints-summary/register-agent/containers/register-agent/register-agent';
import { ExportConfiguration } from './components/export-configuration';
import { AgentsWelcome } from '../../components/common/welcome/agents-welcome';
import { Mitre } from '../../components/overview';
import { AgentsTable } from '../../components/endpoints-summary/table/agents-table';
import { MainModule } from '../../components/common/modules/main';
import { MainSyscollector } from '../../components/agents/syscollector/main';
import { MainAgentStats } from '../../components/agents/stats';
import { getAngularModule } from '../../kibana-services';
import { MainEndpointsSummary } from '../../components/endpoints-summary';
import { Overview } from '../../components/overview/overview';

const app = getAngularModule();

app
  .controller('agentsController', AgentsController)
  .value('RegisterAgent', RegisterAgent)
  .value('ExportConfiguration', ExportConfiguration)
  .value('AgentsWelcome', AgentsWelcome)
  .value('Mitre', Mitre)
  .value('AgentsTable', AgentsTable)
  .value('MainSyscollector', MainSyscollector)
  .value('MainAgentStats', MainAgentStats)
  .value('MainModule', MainModule)
  .value('MainEndpointsSummary', MainEndpointsSummary)
  .value('Overview', Overview);
