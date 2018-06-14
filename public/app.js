/*
 * Wazuh app - File for app requirements and set up
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Require CSS
import 'plugins/wazuh/less/loader';
import * as modules from 'ui/modules'
// Set up Wazuh app
const app = modules.get('app/wazuh', ['ngCookies', 'ngMaterial']);

app.config(['$compileProvider', function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data|blob):/);
}])

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.useApplyAsync(true);
}]);

// Font Awesome, Kibana UI framework and others
import 'plugins/wazuh/utils/fontawesome/css/font-awesome.min.css';
import 'plugins/wazuh/utils/when-scrolled/when-scrolled.js';
import './less/ui_framework.css';

// Dev tools
import 'plugins/wazuh/utils/codemirror/codemirror.css'
import 'plugins/wazuh/utils/codemirror/foldgutter.css'
import 'plugins/wazuh/utils/codemirror/ttcn.css'
import 'plugins/wazuh/utils/codemirror/javascript.js'
import 'plugins/wazuh/utils/codemirror/brace-fold.js'
import 'plugins/wazuh/utils/codemirror/foldcode.js'
import 'plugins/wazuh/utils/codemirror/foldgutter.js'
import 'plugins/wazuh/utils/codemirror/search-cursor.js'
import 'plugins/wazuh/utils/codemirror/mark-selection.js'


// Material
import 'plugins/wazuh/../node_modules/angular-material/angular-material.css';
import 'plugins/wazuh/../node_modules/angular-aria/angular-aria.js';
import 'plugins/wazuh/../node_modules/angular-animate/angular-animate.js';
import 'plugins/wazuh/../node_modules/angular-material/angular-material.js';

// Cookies
import 'plugins/wazuh/../node_modules/angular-cookies/angular-cookies.min.js';

import 'ui/autoload/all';
import 'ui/chrome';

// Wazuh
import 'plugins/wazuh/kibana-integrations'
import 'plugins/wazuh/services'
import 'plugins/wazuh/controllers'
import 'plugins/wazuh/factories'
import 'plugins/wazuh/directives'
