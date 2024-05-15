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
import { RegisterAgent } from '../../components/endpoints-summary/register-agent/containers/register-agent/register-agent';
import { MainModule } from '../../components/common/modules/main';
import { getAngularModule } from '../../kibana-services';
import { MainEndpointsSummary } from '../../components/endpoints-summary';
import { Overview } from '../../components/overview/overview';
import { AgentView } from '../../components/endpoints-summary/agent';

const app = getAngularModule();

app
  .value('RegisterAgent', RegisterAgent)
  .value('AgentView', AgentView)
  .value('MainModule', MainModule)
  .value('MainEndpointsSummary', MainEndpointsSummary)
  .value('Overview', Overview);
