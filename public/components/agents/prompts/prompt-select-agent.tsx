/*
 * Wazuh app - Prompt when an agent is not selected
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
import { useDispatch } from 'react-redux';
import { EuiButton, EuiEmptyPrompt } from '@elastic/eui';
import { showExploreAgentModal } from '../../../redux/actions/appStateActions';

type PromptSelectAgentProps = {
  body?: string;
  title: string;
};

export const PromptSelectAgent = ({ body, title }: PromptSelectAgentProps) => {
  const dispatch = useDispatch();
  const openAgentSelector = () => dispatch(showExploreAgentModal(true));
  return (
    <EuiEmptyPrompt
      iconType="watchesApp"
      title={<h2>{title}</h2>}
      body={body && <p>{body}</p>}
      actions={
        <EuiButton color="primary" fill onClick={openAgentSelector}>
          Select agent
        </EuiButton>
      }
    />
  );
};
