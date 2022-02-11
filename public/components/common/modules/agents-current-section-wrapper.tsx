/*
 * Wazuh app - React component for building the Overview welcome screen.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import WzCurrentAgentsSection from './agents-current-section';
import { compose } from 'redux';
import { withErrorBoundary, withReduxProvider } from '../hocs';

export const WzCurrentAgentsSectionWrapper = compose (withErrorBoundary, withReduxProvider) (WzCurrentAgentsSection);
