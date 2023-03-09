import { BaseRouter } from '@splunk/swc-mc';
import { _ } from '@splunk/ui-utils/i18n';
import 'core-js';
import $ from 'jquery';
import React from 'react';
import { render } from 'react-dom';
import SplunkAssistShell from '../views/splunk_assist/shell/components/SplunkAssistShell';

class SplunkAssistRouter extends BaseRouter {
    initialize(...args) {
        BaseRouter.prototype.initialize.call(this, ...args);
        this.remoteNames = args[0];
        this.remoteConfigs = {};
        this.setPageTitle(_('Assist'));
        this.loadingMessage = _('Loading...');
    }

    page(...args) {
        BaseRouter.prototype.page.call(this, ...args);
        Promise.all([this.deferreds.pageViewRendered]).then(() => {
            $('.preload').replaceWith(this.pageView.el);
            render(<SplunkAssistShell />, document.getElementsByClassName('main-section-body')[0]);
        });
    }
}

export default SplunkAssistRouter;
