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

import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { i18n } from '@kbn/i18n';

export const OFFICE_365 = 'office365';
export const WMODULES_WMODULES = 'wmodules-wmodules';
export const HELP_LINKS = [
  {
    text: i18n.translate(
      'wazuh.public.controller.management.config.office365.constant.moniter',
      {
        defaultMessage: 'Using Wazuh to monitor Office 365',
      },
    ),
    href: webDocumentationLink('office365/index.html'),
  },
  {
    text: i18n.translate(
      'wazuh.public.controller.management.config.office365.constant.module',
      {
        defaultMessage: 'Configuration options for the module',
      },
    ),
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/office365-module.html',
    ),
  },
];
