/*
 * Wazuh app - React hook for get wazuh-alert index pattern
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { useEffect, useState } from 'react';
import AppState from '../../../react-services/app-state';
import { IIndexPattern } from '../../../../../../src/plugins/data/public';
import { getIndexPattern } from '../../../kibana-services';

export const useIndexPattern = (): IIndexPattern | undefined => {
  const _indexPatterns = getIndexPattern().query.indexPatterns;
  const [indexPattern, setIndexPattern] = useState();
  useEffect(() => {
    const idIndexPattern = AppState.getCurrentPattern();
    _indexPatterns.get(idIndexPattern).then(setIndexPattern);
  }, []);
  return indexPattern;
};
