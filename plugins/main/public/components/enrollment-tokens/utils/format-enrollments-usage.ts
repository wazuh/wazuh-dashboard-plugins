/*
 * Wazuh app - How many enrollments a token has used, for display
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { i18n } from '@osd/i18n';
import { EnrollmentTokenSummary } from '../../../services/enrollment-tokens';

/* A `max_uses` of 0 is the manager's way of saying unlimited, so the allowance
is spelled out rather than shown as a limit of zero. The use count is kept
either way: besides telling whether a limited token is running out, it is how an
administrator learns whether a token -- a leaked one, say -- was ever used. */
export const formatEnrollmentsUsage = (
  token: Pick<EnrollmentTokenSummary, 'uses' | 'max_uses'>,
): string => {
  const uses = token.uses ?? 0;

  return token.max_uses
    ? i18n.translate('wazuh.enrollmentTokens.formatEnrollmentsUsage.limited', {
        defaultMessage: '{uses} / {maxUses}',
        values: { uses, maxUses: token.max_uses },
      })
    : i18n.translate(
        'wazuh.enrollmentTokens.formatEnrollmentsUsage.unlimitedUses',
        {
          defaultMessage: '{uses} / Unlimited',
          values: { uses },
        },
      );
};
