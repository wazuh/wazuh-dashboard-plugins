/*
 * Wazuh app - Constants of Office365 configuration
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { webDocumentationLink } from "../../../../../../../common/services/web_documentation";

export const OFFICE_365 = 'office365';
export const WMODULES_WMODULES = 'wmodules-wmodules';
export const HELP_LINKS = [
  {
    text: 'Using Wazuh to monitor Office 365',
    href: webDocumentationLink('office365/index.html'),
  },
  {
    text: 'Configuration options for the module',
    href: webDocumentationLink('user-manual/reference/ossec-conf/office365-module.html'),
  },
];
