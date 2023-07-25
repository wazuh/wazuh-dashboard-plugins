/*
 * Wazuh app - React component for building the management welcome screen.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 * DELETE THIS WRAPPER WHEN WELCOME SCREEN WAS NOT BE CALLED FROM ANGULARJS
 */
import ManagementWelcome from './management-welcome';
import './welcome.scss';
import { compose } from 'redux';
import { withErrorBoundary, withReduxProvider } from '../hocs';

export const ManagementWelcomeWrapper = compose (withErrorBoundary,withReduxProvider)(ManagementWelcome)
