/*
 * Wazuh app - Help links of policy monitoring.
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

export default [
  {
    text: 'Malware detection',
    href: DOC_LINKS.USER_MANUAL.CAPABILITIES.MALWARE_DETECTION.INDEX,
  },
  {
    text: 'Monitoring security policies',
    href: DOC_LINKS.USER_MANUAL.CAPABILITIES.POLICY_MONITORING.INDEX,
  },
  {
    text: 'Rootcheck reference',
    href: DOC_LINKS.USER_MANUAL.REFERENCE.OSSEC_CONF.ROOTCHECK,
  },
];
