/*
 * Wazuh app - Prompt when an agent doesn't support some module
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

export const PromptAgentFeatureVersion = ({ version = '' }: { version: string }) => {
  return (
    <EuiEmptyPrompt
      iconType="watchesApp"
      title={<h2>{`Agent doesn't support this feature`}</h2>}
      body={`This feature is only available for agents with ${version}.`}
    />
  );
};
