import 'core-js';
import React from 'react';
import $ from 'jquery';
import { render } from 'react-dom';
import { _ } from '@splunk/ui-utils/i18n';
import {
    BaseRouter,
    IndexesCollection,
    ClusterConfigModel,
    HealthDetailsModel,
    ThemeUtils,
    HealthConfigModel,
    DistributedHealthDetailsModel
} from '@splunk/swc-mc';
/*eslint-disable */
import Bookmarks from '../collections/Bookmarks';
import Metrics from '../collections/Metrics';
import Landing from '../views/landing/Landing';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';
/*eslint-enable */

class MonitoringConsoleLandingRouter extends BaseRouter {
    initialize(...args) {
        BaseRouter.prototype.initialize.call(this, ...args);
        this.setPageTitle(_('Summary'));
        this.fetchContent();
    }

    fetchContent() {
        this.model.healthConfig = new HealthConfigModel({ id: 'distributed_health_reporter' });
        this.deferreds.healthConfig = this.model.healthConfig.fetch();

        // Health Details - For Anomalies Tabel + Deployment Components
        this.model.healthDetails = new HealthDetailsModel();
        this.model.healthDetails.set({ id: 'details' });
        this.deferreds.healthDetails = this.model.healthDetails.fetch();

        this.model.distHealthDetails = new DistributedHealthDetailsModel();
        this.model.distHealthDetails.set({ id: 'details' });
        this.deferreds.distHealthDetails = this.model.distHealthDetails.fetch();

        // Indexer Cluster Config - For Deployment Topology
        this.model.indexerClustering = new ClusterConfigModel();
        this.deferreds.indexerClustering = this.model.indexerClustering.fetch();

        // Bookmarks Collection - For Bookmark Component
        this.collection.bookmarks = new Bookmarks();
        this.deferreds.bookmarks = this.collection.bookmarks.fetch();

        // MC Metrics - For Deployment Metrics
        this.collection.metrics = new Metrics();
        this.deferreds.metrics = this.collection.metrics.fetch();

        // Indexes - For Deployment Metrics
        this.collection.indexes = new IndexesCollection();
        this.deferreds.indexes = this.collection.indexes.fetch();
    }

    page(...args) {
        BaseRouter.prototype.page.call(this, ...args);
        Promise.all([
            this.deferreds.pageViewRendered,
            this.deferreds.application,
            this.deferreds.healthConfig,
            this.deferreds.healthDetails,
            this.deferreds.distHealthDetails,
            this.deferreds.indexerClustering,
            this.deferreds.bookmarks,
            this.deferreds.metrics,
            this.deferreds.indexes,
        ]).then(() => {
            $('.preload').replaceWith(this.pageView.el);
            const isDistributed = !this.model.healthConfig.entry.content.get('disabled');
            const isDistDisabled = this.model.distHealthDetails.isDisabled();
            const props = {
                appLocal: this.model.appLocal,
                application: this.model.application,
                serverInfo: this.model.serverInfo,
                isDistributed: !isDistDisabled,  // eslint-disable-line
                healthDetails: isDistDisabled ? this.model.healthDetails : this.model.distHealthDetails,
                indexerClustering: this.model.indexerClustering,
                bookmarks: this.collection.bookmarks,
                metrics: this.collection.metrics,
                indexes: this.collection.indexes.models.length,
                distDeploymentComponentsStandAlone: (isDistributed && isDistDisabled) ? this.model.healthDetails.getFeatures() : false,  // eslint-disable-line
                isDistDisabled: isDistDisabled,  // eslint-disable-line
            };

            render(
                <SplunkThemeProvider {...ThemeUtils.getCurrentTheme()}>
                    <Landing {...props} />
                </SplunkThemeProvider>,
                document.getElementsByClassName('main-section-body')[0],
            );
        });
    }
}

export default MonitoringConsoleLandingRouter;
