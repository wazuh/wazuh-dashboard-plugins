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

import React, { useState, useEffect } from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { WazuhConfig } from '../../../../../react-services/wazuh-config';


export const PromptStatisticsNoIndices = () => {
  const [indexName, setIndexName] = useState("");

  useEffect(() => {
    const wazuhConfig = new WazuhConfig();
    const config = wazuhConfig.getConfig();
    setIndexName(`${config["cron.prefix"] || 'wazuh'}-${config["cron.statistics.index.name"] || 'stastistics'}-*`)
  }, []);

  return (
    <EuiEmptyPrompt
      iconType="securitySignalDetected"
      title={<h2>{indexName} indices were not found.</h2>}
    />
  )
}