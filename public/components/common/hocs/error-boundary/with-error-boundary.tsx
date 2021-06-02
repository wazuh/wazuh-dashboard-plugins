/*
 * Wazuh app - React HOCs to manage user authorization requirements
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import ErrorBoundary from '../../error-boundary/error-boundary';

export const withErrorBoundary = (WrappedComponent) => (props) => (
  <ErrorBoundary>
    <WrappedComponent {...props} />
  </ErrorBoundary>
);
