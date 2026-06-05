/*
 * Wazuh app - Saved Objects management service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { getSavedObjects } from '../kibana-services';

export class SavedObject {
  // Fetch a dashboard saved object by id using SavedObjects client and filter by id client-side
  static async getDashboardById(dashboardID) {
    try {
      // Request dashboards via SavedObjects client; include common fields to avoid a second fetch
      return await getSavedObjects().client.get('dashboard', dashboardID);
    } catch (error) {
      throw error?.data?.message || false
        ? new Error(error.data.message)
        : error;
    }
  }
}
