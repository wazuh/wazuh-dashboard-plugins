import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { values, isObject } from 'lodash';
import { _ } from '@splunk/ui-utils/i18n';
import Error from '@splunk/react-icons/Error';
import InfoCircle from '@splunk/react-icons/InfoCircle';
import Success from '@splunk/react-icons/Success';
import Warning from '@splunk/react-icons/Warning';
import List from '@splunk/react-ui/List';
import Message from '@splunk/react-ui/Message';
import Table from '@splunk/react-ui/Table';
import DL from '@splunk/react-ui/DefinitionList';
import Heading from '@splunk/react-ui/Heading';
import './Anomalies.pcss';

export const icons = {
    green: {
        type: 'success',
        icon: <Success size={1.6} data-test-name="success-icon" className="successIcon" />,
    },
    red: {
        type: 'error',
        icon: <Error size={1.6} data-test-name="error-icon" className="errorIcon" />,
    },
    yellow: {
        type: 'warning',
        icon: <Warning size={1.6} data-test-name="warning-icon" className="warningIcon" />,
    },
    info: {
        type: 'info',
        icon: <InfoCircle size={1.6} data-test-name="info-icon" className="infoIcon" />,
    },
};

class Anomalies extends Component {
    static propTypes = {
        isDistributed: PropTypes.bool.isRequired,
        anomalies: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    }

    /*eslint-disable */
    getExpansionRow = anomaly => {
        // Only display 3 instances on the anomalies table
        let count = 3;
        return (
            <Table.Row>
                <Table.Cell colSpan={4}>
                    <Heading level={4}>Instances</Heading>
                    {anomaly.instances.map(instance => {
                        if (count > 0) {
                            count --;
                            return (
                                <DL termWidth={300} key={`anomalies-table-instance-${instance.name}`}>
                                    <DL.Term>{instance.name}</DL.Term>
                                    <DL.Description>{Date(instance.timestamp)}</DL.Description>
                                </DL>
                            )
                        }
                    })}
                </Table.Cell>
            </Table.Row>
        );
        /*eslint-enable */
    }

    renderDescriptions = (anomaly) => {
        const children = [];
        if (anomaly.reasons) {
            values(values(anomaly.reasons)[0]).forEach((reasonObj, index) => {
                children.push(
                    <List.Item
                        key={`${reasonObj.due_to_stanza}-${index}`} // eslint-disable-line react/no-array-index-key
                    >
                        { reasonObj.reason }
                    </List.Item>,
                );
            });
        } else if (anomaly.instances) {
            const keys = Object.keys(anomaly.instances);
            /*eslint-disable */
            keys.forEach(function(key, index) {
                if (isObject(anomaly.instances[key])) {
                    children.push(
                        <List.Item key={`reason-${anomaly.instances[key].reason}-${index}`}>
                            { anomaly.instances[key].reason }
                        </List.Item>
                    );
                } 
            });
            /*eslint-enable */
        } else {
            children.push(
                <List.Item>
                    { _('Description is not available.') }
                </List.Item>,
            );
        }
        return (
            <List className="anomaly-description">{ children }</List>
        );
    }

    renderNoAnomalies = () => (
        <div data-test-name="no-anomalies-section" className="no-anomalies-section">
            <Message type={icons.green.type}>
                { _('No anomalies found in your deployment.') }
            </Message>
        </div>
    )

    render() {
        const { isDistributed, anomalies } = this.props;
        let anomolyKeyCount = 0;
        return anomalies.length > 0 ? (
            <div>
                <Table
                    stripeRows
                    rowExpansion={isDistributed ? 'multi' : 'none'}
                    tableStyle={{ backgroundColor: 'white' }}
                    data-test-name="anomalies-table"
                >
                    <Table.Head data-test-name="anomalies-table-head">
                        <Table.HeadCell
                            data-test-name="anomalies-table-head-cell-status"
                        >
                            {_('Status')}
                        </Table.HeadCell>
                        <Table.HeadCell
                            data-test-name="anomalies-table-head-cell-description"
                        >
                            {_('Description')}
                        </Table.HeadCell>
                        <Table.HeadCell
                            data-test-name="anomalies-table-head-cell-feature"
                            width={300}
                        >
                            {_('Feature')}
                        </Table.HeadCell>
                    </Table.Head>

                    <Table.Body data-test-name="anomalies-table-body">
                        {/*eslint-disable */}
                        {anomalies.map(anomaly => {
                            const anomalyName = isDistributed ? anomaly.name : anomaly.name[anomaly.name.length-1];
                            return (
                                <Table.Row
                                    key={`anomalies-table-row-${anomalyName}`.concat(anomolyKeyCount++)}
                                    expansionRow={isDistributed ? this.getExpansionRow(anomaly) : undefined}
                                    data-test-name={`anomalies-table-row-${anomalyName}`}
                                    data-test-path={anomaly.path ? `anomalies-table-row-${anomaly.path}` : "unknown"}
                                >
                                    <Table.Cell
                                        className='status-cell'
                                        data-test-name={`${anomalyName}-cell-status`}
                                    >
                                        { icons[`${anomaly.health}`].icon }
                                    </Table.Cell>
                                    <Table.Cell
                                        data-test-name={`${anomalyName}-cell-description`}
                                    >
                                        {this.renderDescriptions(anomaly)}
                                    </Table.Cell>
                                    <Table.Cell
                                        data-test-name={`${anomalyName}-cell-feature`}
                                    >
                                        {anomaly.name.join(' | ')}
                                    </Table.Cell>
                                </Table.Row>
                            );
                        })}
                    {/*eslint-enable */}
                    </Table.Body>
                </Table>
            </div>
        ) : this.renderNoAnomalies();
    }
}

export default Anomalies;