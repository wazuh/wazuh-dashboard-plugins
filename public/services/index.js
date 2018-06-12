/*
 * Wazuh app - File for app requirements and set up
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import 'plugins/wazuh/services/error-handler'
import 'plugins/wazuh/services/theming';
import 'plugins/wazuh/services/api-request'
import 'plugins/wazuh/services/generic-request'
import 'plugins/wazuh/services/data-handler'
import 'plugins/wazuh/services/app-state'
import 'plugins/wazuh/services/api-tester'
import 'plugins/wazuh/services/pattern-handler'
import 'plugins/wazuh/services/routes'
import 'plugins/wazuh/services/csv-request'
import 'plugins/wazuh/services/common-data'
import 'plugins/wazuh/services/reporting'