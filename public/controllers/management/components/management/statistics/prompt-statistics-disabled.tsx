/*
 * Wazuh app - Prompt when Statistics is disabled
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
import { EuiEmptyPrompt, EuiButton } from '@elastic/eui';
import { AppNavigate } from '../../../../../react-services/app-navigate';

export const PromptStatisticsDisabled = () => {
  const goToConfigure = e => {
    AppNavigate.navigateToModule(e, 'settings', { tab: 'configuration', category: 'statistics' })
  };

  return (
    <EuiEmptyPrompt
      iconType="securitySignalDetected"
      title={<h2>Statistics is disabled</h2>}
      actions={
        <EuiButton color="primary" fill iconType="gear" onMouseDown={goToConfigure}>
          Go to configure
        </EuiButton>  
      }
    />
  )
}