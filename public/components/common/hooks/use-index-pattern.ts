/*
 * Wazuh app - React hook for get wazuh-alert index pattern
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { useState, useEffect} from 'react';
//@ts-ignore
import { AppState } from '../../../react-services/app-state';
import { IIndexPattern } from '../../../../../../src/plugins/data/public';
import { getDataPlugin } from '../../../kibana-services';

export const useIndexPattern = (): IIndexPattern | undefined => {
  const [indexPattern, setIndexPattern] = useState();
  useEffect(() => {
  const idIndexPattern = AppState.getCurrentPattern();
  getDataPlugin().indexPatterns.get(idIndexPattern)
    .then(setIndexPattern);
  }, []);
  return indexPattern;
}