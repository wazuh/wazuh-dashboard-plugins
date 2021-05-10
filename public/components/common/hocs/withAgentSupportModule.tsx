/*
 * Wazuh app - React HOC to show a prompt when an agent doesn't support any module
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { PromptAgentNoSupportModule } from '../../agents/prompts';
import { withGuard } from '../../common/hocs';
import { hasAgentSupportModule } from '../../../react-services/wz-agents';

export const withAgentSupportModule = WrappedComponent =>
  withGuard(
    ({agent, component}) => Object.keys(agent).length && !hasAgentSupportModule(agent, component),
    PromptAgentNoSupportModule
  )(WrappedComponent)
