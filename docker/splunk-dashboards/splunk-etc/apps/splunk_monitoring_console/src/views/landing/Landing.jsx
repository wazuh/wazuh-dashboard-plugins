import React from 'react';
import PropTypes from 'prop-types';
import { gettext } from '@splunk/ui-utils/i18n';
import Heading from '@splunk/react-ui/Heading';
import Link from '@splunk/react-ui/Link';
import P from '@splunk/react-ui/Paragraph';
import { URIRoute } from '@splunk/swc-mc';
import Bookmark from './bookmark/Bookmark';
import Anomalies from './Anomalies';
import MetricsPanel from './deploymentPanels/MetricsPanel';
import ComponentsPanel from './deploymentPanels/ComponentsPanel';
import TopologyPanel from './deploymentPanels/TopologyPanel';
import './Landing.pcss';

class Landing extends React.Component {  // eslint-disable-line
    static propTypes = {
        appLocal: PropTypes.shape({}).isRequired,
        application: PropTypes.shape({
            get: PropTypes.func.isRequired,
        }).isRequired,
        serverInfo: PropTypes.shape({
            getProductName: PropTypes.func,
            getVersion: PropTypes.func,
        }).isRequired,
        isDistributed: PropTypes.bool.isRequired,
        healthDetails: PropTypes.shape({
            fetch: PropTypes.func,
            getAnomalies: PropTypes.func,
            getFeatures: PropTypes.func,
            models: PropTypes.arrayOf(PropTypes.shape({})),
            on: PropTypes.func,
        }).isRequired,
        indexerClustering: PropTypes.shape({}).isRequired,
        bookmarks: PropTypes.shape({
            fetch: PropTypes.func,
            updateBookmarks: PropTypes.func,
            getBookmarks: PropTypes.func,
            models: PropTypes.arrayOf(PropTypes.shape({})),
            on: PropTypes.func,
        }).isRequired,
        metrics: PropTypes.shape({
            fetch: PropTypes.func,
            models: PropTypes.arrayOf(PropTypes.shape({})),
            on: PropTypes.func,
            getMetrics: PropTypes.func,
            getEnabledMetrics: PropTypes.func,
        }).isRequired,
        indexes: PropTypes.number.isRequired,
    };

    /**
     * Render landing page.
     */
    render() {
        const {
            isDistributed,
            serverInfo,
            healthDetails,
            bookmarks,
            appLocal,
            indexes,
            indexerClustering,
            metrics,
            distDeploymentComponentsStandAlone,  // eslint-disable-line
            isDistDisabled,  // eslint-disable-line
        } = this.props;

        const learnMore = URIRoute.docHelp(
            this.props.application.get('root'),
            this.props.application.get('locale'),
            'learnmore.dmc.summary_dashboard',
        );

        return (
            <div
                data-test-name="monitoring-console-landing"
                className="overall-section"
            >
                <div
                    data-test-name="landing-navigation"
                    className="navigation-section"
                >
                    <Bookmark bookmarks={bookmarks} />
                </div>
                <div
                    data-test-name="landing-content"
                    className="content-section"
                >
                    <div
                        data-test-name="landing-heading-section"
                    >
                        <Heading
                            level={1}
                            data-test-name="landing-heading"
                            className="heading"
                        >
                            {gettext(`Overview of ${serverInfo.getProductName()}
                                ${serverInfo.getVersion() || gettext('N/A')}`)}
                        </Heading>
                        <P
                            className="heading-description"
                            data-test-name="landing-heading-description"
                        >
                            {gettext(`The Summary dashboard integrates health status
                            information from the splunkd health report with monitoring console
                            features, such as Health Check, to let you monitor and investigate
                            issues with your deployment. `)}
                            <Link
                                to={learnMore}
                                openInNewContext
                            >
                                {gettext('Learn more')}
                            </Link>
                        </P>
                    </div>
                    <div
                        data-test-name="landing-mode-section"
                        className="anomalies-section"
                    >
                        <Heading
                            level={2}
                            data-test-name="mode-heading"
                            className="heading"
                        >
                            {gettext('Splunk Deployment Mode: ')}
                            {isDistDisabled ? 'Standalone' : 'Distributed'}
                        </Heading>
                    </div>
                    <div
                        data-test-name="landing-anomalies-section"
                        className="anomalies-section"
                    >
                        <Heading
                            level={2}
                            data-test-name="anomalies-heading"
                            className="heading"
                        >
                            {gettext('Anomalies')}
                        </Heading>
                        <Anomalies
                            isDistributed={isDistributed}
                            anomalies={healthDetails.getAnomalies()}
                        />
                    </div>
                    <div
                        data-test-name="landing-deployment-section"
                        className="deployment-section"
                    >
                        <div
                            data-test-name="deployment-topology"
                            className="deployment-sub-section-left"
                        >
                            <Heading
                                level={2}
                                data-test-name="topology-heading"
                                className="heading"
                            >
                                {gettext('Deployment Topology')}
                            </Heading>
                            <TopologyPanel
                                appLocal={appLocal}
                                indexes={indexes}
                                indexerClustering={indexerClustering}
                            />
                        </div>
                        <div
                            data-test-name="deployment-metrics"
                            className="deployment-sub-section-center"
                        >
                            <Heading
                                level={2}
                                data-test-name="metrics-heading"
                                className="heading"
                            >
                                {gettext('Deployment Metrics')}
                            </Heading>
                            <MetricsPanel metrics={metrics} />
                        </div>
                        <div
                            data-test-name="deployment-components"
                            className="deployment-sub-section-right"
                        >
                            <Heading
                                level={2}
                                data-test-name="components-heading"
                                className="heading"
                            >
                                {gettext('Deployment Components')}
                            </Heading>
                            <ComponentsPanel
                                features={!distDeploymentComponentsStandAlone ? healthDetails.getFeatures() : distDeploymentComponentsStandAlone}  // eslint-disable-line
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Landing;
