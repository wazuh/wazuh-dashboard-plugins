/*
 * Wazuh app - Prompt component to notify when no security plugin is installed in Security/Users tab
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
import { EuiEmptyPrompt, EuiSpacer } from '@elastic/eui';
import { WAZUH_SECURITY_PLUGINS } from '../../../../util/constants';

export const PromptNoSecurityPluginUsers = () => {
  return (
    <EuiEmptyPrompt
      iconType='securityApp'
      title={<h2>No security plugin installed</h2>}
      body={
        <>
          <p>A supported security plugin is required to see and manage the users.</p>
          <div>Supported plugins:</div>
          <EuiSpacer size='s'/>
          <ul style={{listStyleType: 'none', margin: 0, padding: 0}}>
            {WAZUH_SECURITY_PLUGINS.map(securityPlugin => <li key={`security-plugin-${securityPlugin}`}><strong>{securityPlugin}</strong></li>)}
          </ul>
        </>
      }
    />
  )
}