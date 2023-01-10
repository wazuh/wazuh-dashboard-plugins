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
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { i18n } from '@kbn/i18n';

const text1 = i18n.translate(
  'controller.manage.comp.confi.setting.response.active.text1',
  {
    defaultMessage: 'Using Wazuh to monitor AWS',
  },
);
const text2 = i18n.translate(
  'controller.manage.comp.confi.setting.response.active.text2',
  {
    defaultMessage: 'Amazon S3 module reference',
  },
);
export default [
  {
    text: text1,
    href: webDocumentationLink('amazon/index.html'),
  },
  {
    text: text2,
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/wodle-s3.html',
    ),
  },
];
