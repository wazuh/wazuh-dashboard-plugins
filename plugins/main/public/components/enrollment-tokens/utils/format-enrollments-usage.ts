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

/* A `max_uses` of 0 is the manager's way of saying unlimited, so it is spelled
out rather than shown as a limit of zero -- and with no allowance to count
against, the use count on its own says nothing about whether the token is
running out, which is what this column is read for. */
export const formatEnrollmentsUsage = (
  token: Pick<EnrollmentTokenSummary, 'uses' | 'max_uses'>,
): string =>
  token.max_uses
    ? i18n.translate('wazuh.enrollmentTokens.formatEnrollmentsUsage.limited', {
        defaultMessage: '{uses} / {maxUses}',
        values: { uses: token.uses ?? 0, maxUses: token.max_uses },
      })
    : i18n.translate(
        'wazuh.enrollmentTokens.formatEnrollmentsUsage.unlimited',
        {
          defaultMessage: 'Unlimited',
        },
      );
