/*
 * Wazuh app - Prompt when Statistics has not indices
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useEffect, useReducer } from 'react';
import { EuiEmptyPrompt, EuiButton, EuiProgress } from '@elastic/eui';


export const PromptStatisticsNoIndices = () => {
  return (
    <EuiEmptyPrompt
      iconType="securitySignalDetected"
      title={<h2>Statistics has no indices</h2>}
    />
  )
}