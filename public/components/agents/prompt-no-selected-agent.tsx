/*
 * Wazuh app - Prompt when an agent is not selected
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import { EuiEmptyPrompt, EuiButton } from '@elastic/eui';
import { showExploreAgentModal } from '../../redux/actions/appStateActions';


export const PromptNoSelectedAgent = ({body}) => {
  const dispatch = useDispatch();
  const openAgentSelector = () => dispatch(showExploreAgentModal(true));
  return (
    <EuiEmptyPrompt
      iconType="watchesApp"
      title={<h2>No agent is selected</h2>}
      body={<p>{body}</p>
      }
      actions={
        <EuiButton color="primary" fill onClick={openAgentSelector}>
          Select agent
        </EuiButton>
      }
    />
  )
}