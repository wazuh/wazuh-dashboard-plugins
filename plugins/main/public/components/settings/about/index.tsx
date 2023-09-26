/*
 * Wazuh app - React component for Settings > About
 *
 * Copyright (C) 2015-2023 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import { compose } from 'redux';
import {
  withUserAuthorizationPrompt,
  withErrorBoundary,
  withReduxProvider,
} from '../../common/hocs';
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../../common/constants';
import { SettingsAboutPage } from './aboutPage';

export const SettingsAbout = compose(
  withErrorBoundary,
  withReduxProvider,
  withUserAuthorizationPrompt(null, [WAZUH_ROLE_ADMINISTRATOR_NAME])
)(SettingsAboutPage);
