/*
 * Wazuh app - Prompt when Statistics has not indices
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
import { EuiEmptyPrompt } from '@elastic/eui';

export const PromptStatisticsNoIndices = ({
  indexPatternID,
  existIndexPattern,
}) => {
  return existIndexPattern ? (
    <EuiEmptyPrompt
      iconType='securitySignalDetected'
      title={<h2>{indexPatternID} indices were not found.</h2>}
    />
  ) : (
    <EuiEmptyPrompt
      iconType='securitySignalDetected'
      title={<h2>There was a problem creating the index pattern.</h2>}
    />
  );
};
