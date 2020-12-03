/*
 * Wazuh app - Stylesheets loader
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/* -------------------------------------------------------------------------- */
/* ------------------------ Wazuh stylesheets loader ------------------------ */
/* -------------------------------------------------------------------------- */

import './common.less';
import './component.less';
import './height.less';
import './layout.less';
import './media-queries.less';
import './typography.less';

import chrome from 'ui/chrome';
const IS_DARK_THEME = chrome.getUiSettingsClient().get('theme:darkMode');
/* eslint-disable no-undef */
if (IS_DARK_THEME) {
  import('./dark_theme/wz_theme_dark.css').then();
  import('./7.9.0/index.dark.css').then();
}else{
  import('./7.9.0/index.light.css').then();
}
/* eslint-enable no-undef */
