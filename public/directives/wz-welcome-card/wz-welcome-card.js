/*
 * Wazuh app - Wazuh welcome card directive
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import template from './wz-welcome-card.html';
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

app.directive('wzWelcomeCard',function(){
    return {
        restrict: 'E',
        scope: {
            title:       '=title',
            description: '=description',
            logo:        '=logo',
            switchTab:   '&',
            currentTab:  '=currentTab',
            wzLogo:      '=wzLogo'
        },
        replace: true,
        link: function(scope,elm,attrs){
            scope.callSwitchTab = () => scope.switchTab();
        },
        template
    };
});