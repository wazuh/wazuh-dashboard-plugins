/*
 * Wazuh app - Prompt when an agent doesn't support some module
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
import { EuiButton, EuiEmptyPrompt } from '@elastic/eui';
import { PinnedAgentManager } from '../../wz-agent-selector/wz-agent-selector-service';

type PromptSelectAgentProps = {
  body?: string;
  title: string;
};

export const PromptModuleNotForAgent = ({
  body,
  title,
}: PromptSelectAgentProps) => {
  const pinnedAgentManager = new PinnedAgentManager();

  const unpinAgent = async () => {
    pinnedAgentManager.unPinAgent();
  };

  return (
    <EuiEmptyPrompt
      iconType='watchesApp'
      title={<h2>{title}</h2>}
      body={body && <p>{body}</p>}
      actions={
        <EuiButton color='primary' fill onClick={unpinAgent}>
          Unpin agent
        </EuiButton>
      }
    />
  );
};
