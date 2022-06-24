/*
 * Wazuh app - Stylesheets loader
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import { getUiSettings } from '../kibana-services';

import './common.scss';
import './component.scss';
import './height.scss';
import './layout.scss';
import './media-queries.scss';
import './typography.scss';
import './inventory.scss';

const IS_DARK_THEME = getUiSettings().get('theme:darkMode');
/* tslint-disable no-undef */
if (IS_DARK_THEME) {
  import('./theme/dark/index.dark.scss').then();
  import('./7.9.0/index.dark.scss').then();
}else{
  import('./theme/light/index.light.scss').then();
  import('./7.9.0/index.light.scss').then();
}
/* tslint-enable no-undef */
