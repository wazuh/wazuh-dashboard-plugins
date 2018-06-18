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
import './less/loader';
import { uiModules } from 'ui/modules'
// Set up Wazuh app
const app = uiModules.get('app/wazuh', ['ngCookies', 'ngMaterial']);

app.config(['$compileProvider', function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data|blob):/);
}])

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.useApplyAsync(true);
}]);

// Font Awesome, Kibana UI framework and others
import './utils/fontawesome/css/font-awesome.min.css';
import './utils/when-scrolled/when-scrolled.js';
import './less/ui_framework.css';

// Dev tools
import './utils/codemirror/codemirror.css'
import './utils/codemirror/foldgutter.css'
import './utils/codemirror/ttcn.css'
import './utils/codemirror/javascript.js'
import './utils/codemirror/brace-fold.js'
import './utils/codemirror/foldcode.js'
import './utils/codemirror/foldgutter.js'
import './utils/codemirror/search-cursor.js'
import './utils/codemirror/mark-selection.js'


// Material
import './../node_modules/angular-material/angular-material.css';
import './../node_modules/angular-aria/angular-aria.js';
import './../node_modules/angular-animate/angular-animate.js';
import './../node_modules/angular-material/angular-material.js';

// Cookies
import './../node_modules/angular-cookies/angular-cookies.min.js';

import 'ui/autoload/all';
import 'ui/chrome';

// Wazuh
import './kibana-integrations'
import './services'
import './controllers'
import './factories'
import './directives'
