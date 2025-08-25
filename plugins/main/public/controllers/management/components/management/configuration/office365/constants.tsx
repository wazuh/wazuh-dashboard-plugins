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

import { DOC_LINKS } from '../../../../../../../common/doc-links';

export const OFFICE_365 = 'office365';
export const WMODULES_WMODULES = 'wmodules-wmodules';
export const HELP_LINKS = [
  {
    text: 'Monitoring Office 365',
    href: DOC_LINKS.CLOUD_SECURITY.OFFICE365.INDEX,
  },
  {
    text: 'Configuration options for the module',
    href: DOC_LINKS.USER_MANUAL.REFERENCE.OSSEC_CONF.OFFICE365_MODULE,
  },
];
