/*
 * Wazuh app - Help links of CIS-CAT configuration.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { i18n } from "@kbn/i18n"
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
const text1 = i18n.translate('wazuh.controller.manage.comp.confi.cis.cat.text1', {
  defaultMessage: 'CIS-CAT module documentation',
});
const text2 = i18n.translate('wazuh.controller.manage.comp.confi.cis.cat.text2', {
  defaultMessage: 'CIS-CAT module reference',
});
export default [
  {
    text: text1,
    href: webDocumentationLink(
      'user-manual/capabilities/policy-monitoring/ciscat/ciscat.html',
    ),
  },
  {
    text: text2,
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/wodle-ciscat.html',
    ),
  },
];
