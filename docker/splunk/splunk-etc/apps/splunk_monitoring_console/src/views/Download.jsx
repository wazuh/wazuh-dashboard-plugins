import _ from 'underscore';
import { gettext } from '@splunk/ui-utils/i18n';
import React from 'react';
import ReactAdapterBase from './ReactAdapterBase';
import { sprintf } from '@splunk/ui-utils/format';
import Button from '@splunk/react-ui/Button';
import { URIRoute, ThemeUtils } from '@splunk/swc-mc';
// eslint-disable-next-line no-unused-vars
import css from './Download.pcss';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';

const HEALTH_CHECK_ITEMS = 'splunk_health_assistant_addon';

export default ReactAdapterBase.extend({
    moduleId: module.id,
    /**
     * @param {Object} options {
     *     model: {
     *         application: <models.shared.Application>
     *     },
     *     collection: {
     *         appLocalsUnfilteredAll: <collections.services.AppLocals>,
               appLocalsDisabled: <collections.services.AppLocals>,
     *     }
     */
    initialize(options) {
        ReactAdapterBase.prototype.initialize.apply(this, options);
        this.healthChecksApp = this.getHealthChecksApp();
        this.disabled = this.determineDisabled();
    },

    /**
     * Find the Health Checks app in appLocalsUnfilteredAll
     * @returns {Object} health_check_app or null.
     */
    getHealthChecksApp() {
        return _.find(this.options.collection.appLocalsUnfilteredAll.models,
            app => app.entry.attributes.name === HEALTH_CHECK_ITEMS);
    },

    /**
     * Deterimine if the download button should be disabled.
     * @returns {Boolean}
     */
    determineDisabled() {
        // If app is disabled then return true.
        if (_.find(this.options.collection.appLocalsDisabled.models,
            app => app.entry.attributes.name === HEALTH_CHECK_ITEMS)) {
            return true;
        }

        // if app doesn't exist in appLocalsUnfilteredAll, then return false
        // if app is in appLocalsUnfilteredAll but has an update section, then return false
        // otherwise return true, because app exists and is up to date.
        return !!this.healthChecksApp && !this.healthChecksApp.entry.content.attributes['update.version'];
    },

    /**
     * Get the display name of the app.
     * @returns {String}
     */
    getAppDisplayName() {
        return this.healthChecksApp ? this.healthChecksApp.entry.content.attributes.label : '';
    },

    /**
     * Get the current app and page to return to after app download.
     * @returns {String}
     */
    getReturnPath() {
        return sprintf(
            '/app/%s/%s',
            this.options.model.application.get('app'),
            this.options.model.application.get('page'));
    },

    /**
     * Get the link for downloading the app.
     * @returns {String}
     */
    getDownloadLink() {
        // TODO(claral): Update this for cloud.
        const urlData = {
            app_name: this.getAppDisplayName(),
            implicit_id_required: 'False',
            return_to: this.getReturnPath(),
        };

        return URIRoute.manager(
            this.options.model.application.get('root'),
            this.options.model.application.get('locale'),
            'appinstall',
            HEALTH_CHECK_ITEMS,
            { data: urlData },
        );
    },

    /**
     * Render Download button.
     */
    getComponent() {
        return (
            <SplunkThemeProvider {...ThemeUtils.getCurrentTheme()}>
                <Button
                    appearance="primary"
                    data-test-name="btn-download"
                    disabled={this.disabled}
                    label={gettext('Update Health Checks')}
                    to={this.getDownloadLink()}
                    openInNewContext
                />
            </SplunkThemeProvider>
        );
    },
});