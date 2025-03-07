/*
 * Wazuh app - React HOCs handles rendering errors
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
import { PinnedAgentManager } from '../../wz-agent-selector/wz-agent-selector-service';

export const withAgentSync = WrappedComponent => props => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const pinnedAgentManager = new PinnedAgentManager();
    pinnedAgentManager
      .syncPinnedAgentSources({ forceUpdate: true })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  return loading ? null : <WrappedComponent {...props}></WrappedComponent>;
};
