/*
 * Wazuh app - API interface
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export interface IApi {
  id: string
  user: string
  password: string
  url: string
  port: number
  cluster_info: {
    manager: string
    cluster: 'Disabled' | 'Enabled'
    status: 'disabled' | 'enabled'
  }
}