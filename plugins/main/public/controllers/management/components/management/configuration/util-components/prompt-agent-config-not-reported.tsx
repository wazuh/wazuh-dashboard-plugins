/*
 * Wazuh app - Prompt when an agent has never reported its configuration.
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
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { useDispatch } from 'react-redux';

import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { showExploreAgentModalGlobal } from '../../../../../../redux/actions/appStateActions';

const documentationLink = webDocumentationLink(
  'user-manual/manager/reference.html',
);

/**
 * Rendered in place of the configuration when the agent has no document in
 * wazuh-agent-config.
 *
 * It replaces the page rather than sitting inside it: the modules would each
 * open on an empty section, which reads as "this agent configures nothing"
 * when the real answer is that the agent never sent its configuration.
 * Reporting is opt-in, so this is a setting to turn on rather than a failure
 * to recover from.
 */
export const PromptAgentConfigNotReported = () => {
  const dispatch = useDispatch();
  const openAgentSelector = () => dispatch(showExploreAgentModalGlobal(true));

  return (
    <EuiEmptyPrompt
      iconType='reportingApp'
      style={{ marginTop: 20 }}
      title={<h2>Agent configuration not available</h2>}
      body={
        <Fragment>
          {/* Deliberately says nothing about which setting turns reporting on,
        where it lives, or what it defaults to. Those belong to the agent, not
        to this plugin, and copy that repeats them goes stale silently the next
        time the agent changes. What is left is what this view can actually
        observe -- no configuration reported -- with the documentation carrying
        the how. */}
          <p>
            The agent hasn't reported its configuration yet. Check that
            configuration reporting is enabled in the agent settings.
          </p>
          <EuiLink
            href={documentationLink}
            target='_blank'
            rel='noopener noreferrer'
            external
          >
            Local configuration reference
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

export default PromptAgentConfigNotReported;
