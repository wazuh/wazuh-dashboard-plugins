/*
 * Wazuh app - Help links for AWS S3 configuration.
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
    text: 'Using Wazuh to monitor AWS',
    href: webDocumentationLink('amazon/index.html')
  },
  {
    text: 'Amazon S3 module reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/wodle-s3.html')
  }
];
