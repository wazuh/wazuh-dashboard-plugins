/*
 * Wazuh app - React hook for app configuration
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { AppRootState } from '../../../redux/types';
import { useSelector } from 'react-redux';

export const useAppConfig = () => {
  const appConfig = useSelector((state: AppRootState) => state.appConfig);
  console.log(appConfig, 'appConfig in useAppConfig');
  console.log(appConfig.data['fim.pattern'], "appConfig.data['fim.pattern']");

  const FIM_INDEX_PATTERN_ID = appConfig.data['fim.pattern'];
  console.log(FIM_INDEX_PATTERN_ID, 'FIM_INDEX_PATTERN_ID in useAppConfig');
  return appConfig;
};
