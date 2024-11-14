/*
 * Wazuh app - React hook hidde or show the plugin platform loading indicator
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { getHttp } from '../../../kibana-services';
import React, { useEffect, useRef } from 'react';
import { BehaviorSubject } from 'rxjs';
import useObservable from 'react-use/lib/useObservable';

export const useKbnLoadingIndicator = (): [
  boolean,
  (value: boolean) => void,
] => {
  const loadingCount$ = useRef(new BehaviorSubject(0));
  const loading = Boolean(useObservable(loadingCount$.current, 0));

  useEffect(() => {
    getHttp().addLoadingCountSource(loadingCount$.current);
  }, []);

  const setLoading = (value: boolean) => {
    if (value) {
      loadingCount$.current.next(loadingCount$.current.value + 1);
    } else {
      loadingCount$.current.next(loadingCount$.current.value - 1);
    }
  };

  return [loading, setLoading];
};
