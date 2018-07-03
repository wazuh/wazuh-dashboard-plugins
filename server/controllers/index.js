/*
 * Wazuh app - Module to export all the controllers
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import WazuhElastic       from './wazuh-elastic';
import WazuhApiElastic    from './wazuh-api-elastic';
import WazuhApi           from './wazuh-api';
import WazuhReportingCtrl from './wazuh-reporting';

export { WazuhElastic, WazuhApiElastic, WazuhApi, WazuhReportingCtrl };