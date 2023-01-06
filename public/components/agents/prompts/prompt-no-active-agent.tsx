/*
 * Wazuh app - Prompt when an agent is not active
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { PromptSelectAgent } from './';
import { EuiEmptyPrompt } from '@elastic/eui';
import { i18n } from '@kbn/i18n';

export const PromptNoActiveAgent = () => {
  return (
    <PromptSelectAgent
      title='Agent is not active'
      body='This section is only available for active agents.'
    />
  );
};
const moduleTitle = i18n.translate('wazuh.components.agent.prompt.notActive', {
  defaultMessage: 'Agent is not active',
});
export const PromptNoActiveAgentWithoutSelect = () => {
  return (
    <EuiEmptyPrompt
      iconType='watchesApp'
      title={<h2>{moduleTitle}</h2>}
      body='This section is only available for active agents.'
    />
  );
};
