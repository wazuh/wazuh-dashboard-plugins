/*
 * Wazuh app - Prompt when an agent doesn't support some module
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { EuiButton, EuiEmptyPrompt } from '@elastic/eui';
import { updateCurrentAgentData } from '../../../redux/actions/appStateActions';
import { useFilterManager } from '../../common/hooks';

type PromptSelectAgentProps = {
  body?: string;
  title: string;
  agentSelectionProps: {
    setAgent: (agent: boolean) => void
  }
};

export const PromptModuleNotForAgent = ({ body, title, ...agentSelectionProps }: PromptSelectAgentProps) => {
  const dispatch = useDispatch();
  const filterManager = useFilterManager();

  const unpinAgent = async () => {
    dispatch(updateCurrentAgentData({}));
    await agentSelectionProps.setAgent(false);
    const filters = filterManager.filters.filter(x => {
      return x.meta.key !== 'agent.id';
    });
    filterManager.setFilters(filters);
  };

  return (
    <EuiEmptyPrompt
      iconType="watchesApp"
      title={<h2>{title}</h2>}
      body={body && <p>{body}</p>}
      actions={
        <EuiButton color="primary" fill onClick={unpinAgent}>
          Unpin agent
        </EuiButton>
      }
    />
  );
};