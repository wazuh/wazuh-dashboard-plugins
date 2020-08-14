/*
 * Wazuh app - React component for all management section.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { useSelector } from 'react-redux';

/* Return admin mode from Redux Store */
export const useAdminModeAuthorization = () => {
  const adminMode = useSelector(state => state.appStateReducers.adminMode);
  return adminMode;
}