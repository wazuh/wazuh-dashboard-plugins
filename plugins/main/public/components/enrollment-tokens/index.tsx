/*
 * Wazuh app - Enrollment tokens application
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { compose } from 'redux';
import { EuiPage, EuiPageBody } from '@elastic/eui';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withRouteResolvers,
  withUserAuthorizationPrompt,
} from '../common/hocs';
import { nestedResolve } from '../../services/resolves';
import { enrollmentTokens } from '../../utils/applications';
import { EnrollmentTokens } from './enrollment-tokens';

export const MainEnrollmentTokens = compose(
  withErrorBoundary,
  withRouteResolvers({ nestedResolve }),
  withGlobalBreadcrumb([{ text: enrollmentTokens.breadcrumbLabel }]),
  /* Reading the listing is what the view is: without it there is nothing to
  render, so the whole page is behind the permission rather than only the
  table. Creating and revoking are gated separately, on their own controls. */
  withUserAuthorizationPrompt([
    { action: 'enrollment_token:read', resource: '*:*:*' },
  ]),
)(() => (
  <EuiPage paddingSize='m'>
    <EuiPageBody>
      <EnrollmentTokens />
    </EuiPageBody>
  </EuiPage>
));
