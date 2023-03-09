import { _ } from '@splunk/ui-utils/i18n';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SplunkUtil } from '@splunk/swc-mc';
import Button from '@splunk/react-ui/Button';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Heading from '@splunk/react-ui/Heading';
import Modal from '@splunk/react-ui/Modal';
import Message from '@splunk/react-ui/Message';
import './MetricsPanelModal.pcss';

class MetricsPanelModal extends Component {
    static propTypes = {
        metrics: PropTypes.shape({
            fetch: PropTypes.func,
            models: PropTypes.arrayOf(PropTypes.shape({})),
            on: PropTypes.func,
            getMetrics: PropTypes.func,
            find: PropTypes.func,
        }).isRequired,
        handleClose: PropTypes.func.isRequired,
    };

    constructor(props, context) {
        super(props, context);
        this.state = {
            metrics: this.props.metrics.getMetrics(false),
            open: false,
            isWorking: false,
            errorMessage: '',
            changed: false,
        };
        this.props.metrics.on('sync', this.updateMetrics);
        this.editPanelButton = React.createRef();
    }

    updateMetrics = () => {
        this.setState({
            metrics: this.props.metrics.getMetrics(false),
        });
    }

    /**
     * Handler for modal close action.
     */
    handleClose = () => {
        this.setState({
            isWorking: false,
            errorMessage: '',
            open: false,
        });
        if (this.state.changed) {
            this.props.handleClose();
        }
        if (this.editPanelButton.current) {
            this.editPanelButton.current.focus();
        }
    };

    /**
     * Handler for the modal open action.
     */
    handleOpen = () => {
        this.setState({ open: true });
    };

    /**
     * Handles updating the display/hide of a metric.
     * @param {Event} e
     * @param {String} value - metric name
     */
    handleUpdate = (e, { value }) => {
        this.setState({
            isWorking: true,
            changed: true,
        });
        const metric = this.props.metrics.find(m => value === m.entry.attributes.name);
        metric.entry.content.attributes.disabled = !metric.entry.content.attributes.disabled;
        metric.save().done(() => {
            this.props.metrics.fetch();
            this.setState({
                isWorking: false,
                errorMessage: '',
            });
        }).fail((response) => {
            let msg = _('Encountered errors while updating Metrics');
            if (response.responseJSON.messages && response.responseJSON.messages.length > 0) {
                const messageObj = response.responseJSON.messages[0];
                msg = SplunkUtil.sprintf(_('%s: %s'), messageObj.type, messageObj.text);
            }
            this.props.metrics.fetch();
            this.setState({
                isWorking: false,
                errorMessage: msg,
            });
        });
    };

    /**
     * Render metrics panel modal.
     */
    render() {
        return (
            <div>
                <Button
                    data-test-name="edit-page-layout-btn"
                    label={_('Edit Panel')}
                    aria-label={_('Deployment Metrics, Edit Panel')}
                    onClick={this.handleOpen}
                    className="metric-button"
                    ref={this.editPanelButton}
                />
                <Modal
                    data-test-name="deployment-metrics-modal"
                    onRequestClose={this.handleClose}
                    open={this.state.open}
                    className="metric-modal"
                >
                    <Modal.Header
                        data-test-name="metrics-modal-header"
                        title={_('Edit Deployment Metrics Modal')}
                        onRequestClose={this.handleClose}
                    />
                    <Modal.Body data-test-name="metrics-modal-body">
                        {this.state.errorMessage &&
                            (<Message type="error">
                                {this.state.errorMessage}
                            </Message>)
                        }
                        <div
                            data-test-name="metrics-modal-content"
                            className="metric-modal-content"
                        >
                            <div
                                className="metricsAvailable"
                                data-test-name="metrics-available"
                            >
                                <div data-test-name="metrics-recommended">
                                    <Heading level={3}>{_('Recommended Metrics to Display')}</Heading>
                                    {
                                        Object.keys(this.state.metrics).map(metric => (
                                            (this.state.metrics[metric].disabled &&
                                            this.state.metrics[metric].recommended) ?
                                                <ControlGroup
                                                    label={this.state.metrics[metric].displayName}
                                                    labelWidth="250px"
                                                    tooltip={this.state.metrics[metric].description}
                                                    controlsLayout="none"
                                                    key={metric}
                                                    data-test-name={metric}
                                                >
                                                    <Button
                                                        data-test-name="metrics-add"
                                                        appearance="secondary"
                                                        onClick={this.handleUpdate}
                                                        label={_('Add')}
                                                        value={metric}
                                                    />
                                                </ControlGroup>
                                            : null
                                        ))
                                    }
                                </div>
                                <div data-test-name="metrics-other">
                                    <Heading level={3}>{_('Other Metrics')}</Heading>
                                    {
                                        Object.keys(this.state.metrics).map(metric => (
                                            (this.state.metrics[metric].disabled &&
                                            !this.state.metrics[metric].recommended) ?
                                                <ControlGroup
                                                    label={this.state.metrics[metric].displayName}
                                                    labelWidth="250px"
                                                    tooltip={this.state.metrics[metric].description}
                                                    controlsLayout="none"
                                                    key={metric}
                                                    data-test-name={metric}
                                                >
                                                    <Button
                                                        data-test-name="metrics-add"
                                                        appearance="secondary"
                                                        onClick={this.handleUpdate}
                                                        label={_('Add')}
                                                        value={metric}
                                                    />
                                                </ControlGroup>
                                            : null
                                        ))
                                    }
                                </div>
                            </div>
                            <div
                                className="metricsDisplayed"
                                data-test-name="metrics-displayed"
                            >
                                <Heading level={3}>{_('Metrics Displayed')}</Heading>
                                {
                                    Object.keys(this.state.metrics).map(metric => (
                                        !this.state.metrics[metric].disabled ?
                                            <ControlGroup
                                                label={this.state.metrics[metric].displayName}
                                                labelWidth="250px"
                                                tooltip={this.state.metrics[metric].description}
                                                controlsLayout="none"
                                                key={metric}
                                                data-test-name={metric}
                                            >
                                                <Button
                                                    data-test-name="metrics-remove"
                                                    appearance="secondary"
                                                    onClick={this.handleUpdate}
                                                    label={_('Remove')}
                                                    value={metric}
                                                />
                                            </ControlGroup>
                                        : null
                                    ))
                                }
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer
                        showBorder={false}
                        data-test-name="metrics-modal-footer"
                    >
                        <Button
                            data-test-name="metrics-done-btn"
                            onClick={this.handleClose}
                            disabled={this.state.isWorking}
                            label={_('Close')}
                        />
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

export default MetricsPanelModal;
