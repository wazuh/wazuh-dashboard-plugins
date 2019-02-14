/*
 * Wazuh app - Wazuh welcome card directive
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
// @ts-ignore
import template from './wz-welcome-card.html';
// @ts-ignore
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

class WzWelcomeCard {
    private replace: boolean;
    private template: string;
    private restrict: string;
    private scope: object;
    private appState: any;

    constructor(appState: any) {
        this.restrict = 'E';
        this.scope = {
            title: '=title',
            description: '=description',
            logo: '=logo',
            switchTab: '&',
            currentTab: '=currentTab',
            wzLogo: '=wzLogo'
        };
        this.replace = true;
        this.template = template;
        this.appState = appState;
    }

    link(scope, elm, attrs) {
        scope.callSwitchTab = () => {
            this.appState.setNavigation(true);
            scope.switchTab()
        };
    }
}

app.directive('wzWelcomeCard', (appState: any) => new WzWelcomeCard(appState));