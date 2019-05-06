/*
 * Wazuh app - Stylesheets loader
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
import './ui_framework.css';
import './jquery-ui.css';

//import './dark_theme/wz_theme_dark.css';
import chrome from 'ui/chrome';
const IS_DARK_THEME = chrome.getUiSettingsClient().get('theme:darkMode');

if (IS_DARK_THEME) {
  var newSS = document.createElement('link');
  newSS.rel = 'stylesheet';
  newSS.href = '../plugins/wazuh/less/dark_theme/wz_theme_dark.css';
  document.getElementsByTagName('head')[0].appendChild(newSS);

  newSS = document.createElement('link');
  newSS.rel = 'stylesheet';
  newSS.href = '../plugins/wazuh/less/dark_theme/bootstrap_light.less';
  document.getElementsByTagName('head')[0].appendChild(newSS);

  newSS = document.createElement('link');
  newSS.rel = 'stylesheet';
  newSS.href = '../plugins/wazuh/less/dark_theme/kui_light.css';
  document.getElementsByTagName('head')[0].appendChild(newSS);
}
