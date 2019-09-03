/*
 * Author: Elasticsearch B.V.
 * Updated by Wazuh, Inc.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { i18n } from '@kbn/i18n';
import { get } from 'lodash';

export function getPainlessError(error: Error) {
  const rootCause: Array<{ lang: string; script: string }> | undefined = get(
    error,
    'resp.error.root_cause'
  );

  if (!rootCause) {
    return;
  }

  const [{ lang, script }] = rootCause;

  if (lang !== 'painless') {
    return;
  }

  return {
    lang,
    script,
    message: i18n.translate(
      'kbn.discover.painlessError.painlessScriptedFieldErrorMessage',
      {
        defaultMessage: "Error with Painless scripted field '{script}'.",
        values: { script }
      }
    ),
    error: error.message
  };
}
