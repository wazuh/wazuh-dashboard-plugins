import { _ } from '@splunk/ui-utils/i18n';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TimeRangeDropdown from '@splunk/react-time-range/Dropdown';
import SplunkwebConnector from '@splunk/react-time-range/SplunkwebConnector';
import SearchJob from '@splunk/search-job';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import MetricsPanelModal from './MetricsPanelModal';
import './MetricsPanel.pcss';

export const limitedPresets = [
    { label: _('Today'), earliest: '@d', latest: 'now' },
    { label: _('Week to date'), earliest: '@w0', latest: 'now' },
    { label: _('Business week to date'), earliest: '@w1', latest: 'now' },
    { label: _('Month to date'), earliest: '@mon', latest: 'now' },
    { label: _('Year to date'), earliest: '@y', latest: 'now' },
    { label: _('Yesterday'), earliest: '-1d@d', latest: '@d' },
    { label: _('Previous week'), earliest: '-7d@w0', latest: '@w0' },
    { label: _('Previous business week'), earliest: '-6d@w1', latest: '-1d@w6' },
    { label: _('Previous month'), earliest: '-1mon@mon', latest: '@mon' },
    { label: _('Previous year'), earliest: '-1y@y', latest: '@y' },
    { label: _('Last 15 minutes'), earliest: '-15m', latest: 'now' },
    { label: _('Last 60 minutes'), earliest: '-60m@m', latest: 'now' },
    { label: _('Last 4 hours'), earliest: '-4h@m', latest: 'now' },
    { label: _('Last 24 hours'), earliest: '-24h@h', latest: 'now' },
    { label: _('Last 7 days'), earliest: '-7d@h', latest: 'now' },
    { label: _('Last 30 days'), earliest: '-30d@d', latest: 'now' },
];

class DeploymentMetricsPanel extends Component {
    static propTypes = {
        metrics: PropTypes.shape({
            fetch: PropTypes.func,
            models: PropTypes.arrayOf(PropTypes.shape({})),
            on: PropTypes.func,
            getEnabledMetrics: PropTypes.func,
        }).isRequired,
    };

    constructor(props, context) {
        super(props, context);
        this.state = {
            earliest: '-24h@h',
            latest: 'now',
            enabledMetrics: this.props.metrics.getEnabledMetrics(),
            metricsJobs: {},
            metricsResults: {},
        };
    }

    componentDidMount() {
        this.updateMetricsJobs();
    }

    componentWillUnmount() {
        Object.keys(this.state.metricsJobs).forEach((metric) => {
            if (this.state.metricsJobs[metric]) {
                this.state.metricsJobs[metric].unsubscribe();
            }
        });
    }

    /**
     * Search jobs for each of the displayed metrics.
     */
    getMetricsJobs() {
        // for each non-disabled metric create a searchJob
        const metricsJobs = {};
        Object.keys(this.state.enabledMetrics).forEach((metric) => {
            metricsJobs[metric] = SearchJob.create({
                search: this.state.enabledMetrics[metric].search,
                earliest_time: this.state.earliest,
                latest_time: this.state.latest,
            }, {
                app: 'splunk_monitoring_console',
            }).getResults();
        });
        return metricsJobs;
    }

    /**
     * Subscribe to the results of the Metrics search jobs.
     */
    getMetricsResults() {
        Object.keys(this.state.metricsJobs).forEach((metric) => {
            this.state.metricsJobs[metric].subscribe((results) => {
                if (results.results && results.results.length) {
                    const newMetricsResults = { ...this.state.metricsResults };
                    newMetricsResults[metric] = {
                        value: results.results[0].value,
                    };
                    this.setState({
                        metricsResults: newMetricsResults,
                    });
                } else {
                    const newMetricsResults = { ...this.state.metricsResults };
                    newMetricsResults[metric] = {
                        value: 'error',
                    };
                    this.setState({
                        metricsResults: newMetricsResults,
                    });
                }
            });
        });
    }

    /**
     * Create new metrics jobs and subscribe to them.
     */
    updateMetricsJobs() {
        const metricsJobsCurr = this.getMetricsJobs();
        this.setState({
            metricsJobs: metricsJobsCurr,
            metricsResults: {},
        }, this.getMetricsResults);
    }

    /**
     * Repopulate the enabled metrics.
     */
    updateMetrics = () => {
        this.setState({
            enabledMetrics: this.props.metrics.getEnabledMetrics(),
        }, this.updateMetricsJobs);
    }

    /**
     * Update Metrics on modal close.
     */
    handleModalClose = () => {
        this.updateMetrics();
    }

    /**
     * Presets transform function that limits the timerange presets to those listed above.
     * Specifically only non-realtime presets.
     */
    presetsTransform = () => limitedPresets;

    /**
     * Handles search time range change
     * @param {Event} e
     * @param {String} earliest
     * @param {String} latest
     */
    handleTimeRangeChange = (e, { earliest, latest }) => {
        this.setState({
            earliest: earliest,  // eslint-disable-line object-shorthand
            latest: latest,  // eslint-disable-line object-shorthand
        }, this.updateMetricsJobs);
    };

    /**
     * Render the single value of data.
     */
    renderSingleValue = (value) => {
        if (value === 'error') {
            return (<div
                className="metricSingleValue"
                data-test-name="metric-single-value"
            >
                {_('Data not found.')}
            </div>);
        }
        return (
            <div
                className="metricSingleValue"
                data-test-name="metric-single-value"
            >
                {value}
            </div>
        );
    }

    /**
     * Render deployment metrics panel.
     */
    render() {
        return (
            <div
                className="metricsCard"
                data-test-name="deployment-metrics"
            >
                <div
                    className="metricsCardHeader"
                >
                    <SplunkwebConnector
                        presetsTransform={this.presetsTransform}
                    >
                        <TimeRangeDropdown
                            aria-label={_('Deployment Metrics')}
                            onChange={this.handleTimeRangeChange}
                            earliest={this.state.earliest}
                            latest={this.state.latest}
                            labelMaxChars={Infinity}
                            formInputTypes={['relative', 'date', 'dateTime']}
                            advancedInputTypes={['relative', 'dateTime']}
                        />
                    </SplunkwebConnector>
                    <MetricsPanelModal
                        data-test-name="metrics-panel-modal"
                        metrics={this.props.metrics}
                        handleClose={this.handleModalClose}
                    />
                </div>
                <div
                    className="metricsList"
                    data-test-name="metrics-list"
                >
                    {
                        Object.keys(this.state.enabledMetrics).map(metric => (
                            <div
                                className="metricsItem"
                                data-test-name="metrics-item"
                                key={metric}
                            >
                                <div className="metricsItemLabel">
                                    {this.state.enabledMetrics[metric].displayName}
                                </div>
                                {
                                    this.state.metricsResults[metric] ?
                                        this.renderSingleValue(
                                            this.state.metricsResults[metric].value)
                                        :
                                        <WaitSpinner size="medium" />
                                }
                            </div>
                        ))
                    }
                </div>
            </div>
        );
    }
}

export default DeploymentMetricsPanel;
