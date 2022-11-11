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
import { EuiEmptyPrompt, EuiButton } from '@elastic/eui';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';

const documentationLink = webDocumentationLink('user-manual/agents/agent-connection.html');

export const WzAgentNeverConnectedPrompt = () => (
  <EuiEmptyPrompt
    iconType="securitySignalDetected"
    style={{ marginTop: 20 }}
    title={<h2>Agent has never connected.</h2>}
    body={
      <Fragment>
        <p>
          The agent has been registered but has not yet connected to the manager.
        </p>
        <a href={documentationLink} target="_blank">
          Checking connection with the Wazuh server
        </a>
      </Fragment>
    }
    actions={
      <EuiButton href='#/agents-preview?' color="primary" fill>
        Back
      </EuiButton>
  }
  />)