/*
 * Wazuh app - React HOCs handles rendering errors
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
import ErrorBoundary from '../../error-boundary/error-boundary';
import { getDisplayName } from '../utils/utils';

export const withErrorBoundary = (WrappedComponent) => (props) => {
  WrappedComponent.displayName = `withErrorBoundary(${getDisplayName(WrappedComponent)})`;
  return (
    <ErrorBoundary>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
};
