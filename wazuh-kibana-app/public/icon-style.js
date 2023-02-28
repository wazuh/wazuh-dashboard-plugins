/*
 * Wazuh app - Load a different them depending on IS_DARK_THEME value
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/* eslint-disable no-undef */
const newSS = document.createElement('link');
newSS.rel = 'stylesheet';
newSS.href = '../plugins/wazuh/less/icon-style.css';
document.getElementsByTagName('head')[0].appendChild(newSS);
/* eslint-enable no-undef */
