/*
 * Wazuh app - React hook to get the AngularJS $rootScope
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { useEffect, useRef } from 'react';
import { getAngularModule } from '../../../kibana-services';

export function useRootScope(){
  const refRootScope = useRef();
  useEffect(() => {
    const app = getAngularModule();
    refRootScope.current = app.$injector.get('$rootScope');
  },[]);
  return refRootScope.current;
};
