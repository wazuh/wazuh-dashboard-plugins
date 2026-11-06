/*
 * Wazuh app - CTI Explorer application
 * Copyright (C) 2015-2026 Wazuh, Inc.
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
import { withErrorBoundary, withGlobalBreadcrumb } from '../common/hocs';
import { ctiExplorer } from '../../utils/applications';
import { CtiExplorer } from './cti-explorer';

/* The page reads the indexer only, as the signed-in user, so it needs no
server API resolver: the indexer applies the user's index permissions. */
export const MainCtiExplorer = compose(
  withErrorBoundary,
  withGlobalBreadcrumb([{ text: ctiExplorer.breadcrumbLabel }]),
)(() => (
  <EuiPage paddingSize='m'>
    <EuiPageBody>
      <CtiExplorer />
    </EuiPageBody>
  </EuiPage>
));
