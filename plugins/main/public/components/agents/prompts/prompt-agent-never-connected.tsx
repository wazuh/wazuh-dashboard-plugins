/*
 * Wazuh app - Prompt when status agent is Never connected.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Fragment } from 'react';
import { EuiEmptyPrompt, EuiButton, EuiLink } from '@elastic/eui';
import { useDispatch } from 'react-redux';
import { showExploreAgentModalGlobal } from '../../../redux/actions/appStateActions';
import { DOC_LINKS_WITH_FRAGMENTS } from '../../../../common/doc-links';

export const PromptAgentNeverConnected = () => {
  const dispatch = useDispatch();
  const openAgentSelector = () => dispatch(showExploreAgentModalGlobal(true));
  return (
    <EuiEmptyPrompt
      iconType='securitySignalDetected'
      style={{ marginTop: 20 }}
      title={<h2>Agent has never connected.</h2>}
      body={
        <Fragment>
          <p>
            The agent has been registered but has not yet connected to the
            manager.
          </p>
          <EuiLink
            href={
              DOC_LINKS_WITH_FRAGMENTS.AGENT_CONNECTION_CHECKING_CONNECTION_WITH_THE_WAZUH_MANAGER
            }
            target='_blank'
            rel='noopener noreferrer'
            external
          >
            Checking connection with the server
          </EuiLink>
        </Fragment>
      }
      actions={
        <EuiButton color='primary' fill onClick={openAgentSelector}>
          Select agent
        </EuiButton>
      }
    />
  );
};
