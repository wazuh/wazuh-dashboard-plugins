/*
 * Wazuh app - React HOC to show a loader used for Dashboard and Events module tabs
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useState } from 'react';
import { EuiLoadingSpinner, EuiSpacer } from '@elastic/eui';
import { useRootScope } from '../hooks';

export const withModuleTabLoader = WrappedComponent => props => {
  const $rootScope = useRootScope();
  const [showTab, setShowTab] = useState();
  useEffect(() => {
    if($rootScope){
      $rootScope.loadingDashboard = true;
      $rootScope.$applyAsync();
      setTimeout(() => {
        setShowTab(true);
      }, 100);
      return () => {
        $rootScope.loadingDashboard = false;
        $rootScope.$applyAsync();
      }
    }
  },[$rootScope]);

  return showTab ? <WrappedComponent {...props}/> : (
    <>
      <EuiSpacer size='xl' />
      <div style={{ margin: '-8px auto', width: 32 }}>
        <EuiLoadingSpinner size="xl" />
      </div>
    </>
  )
}
