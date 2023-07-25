/*
 * Wazuh app - Help links of vulnerabilities.
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

export default [
  {
    text: 'Vulnerability detection',
    href: webDocumentationLink('user-manual/capabilities/vulnerability-detection/index.html')
  },
  {
    text: 'Vulnerability detector reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/vuln-detector.html')
  }
];
