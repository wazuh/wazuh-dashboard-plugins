/*
 * Wazuh app - React hook to get when Angular Discover started to loading
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { useState, useEffect } from 'react';
import { ModulesHelper } from '../modules/modules-helper';

export function useRefreshAngularDiscover(): number {
  const [refresh, setRefresh] = useState(Date.now());
  useEffect(() => {
    let subscription;
    ModulesHelper.getDiscoverScope()
      .then(scope => {
        subscription = scope.$watch('fetchStatus',
          (fetchStatus) => {
            (fetchStatus === 'loading') && (refresh !== Date.now()) && setRefresh(Date.now())
          });
      });
    return () => { subscription && subscription(); }
  }, []);
  return refresh;
}