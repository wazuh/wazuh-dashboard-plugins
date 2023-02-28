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
  return appConfig;
}
