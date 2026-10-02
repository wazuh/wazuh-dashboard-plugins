/*
 * Wazuh app - React component for add sample data
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component } from 'react';
import { WzButtonPermissions } from '../../components/common/permissions/button';

import {
  EuiFlexItem,
  EuiCard,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiCallOut,
  EuiSpacer,
} from '@elastic/eui';

import { getToasts } from '../../kibana-services';
import { WzRequest } from '../../react-services/wz-request';
import { AppState } from '../../react-services/app-state';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import {
  UI_LOGGER_LEVELS,
  WAZUH_SAMPLE_METRICS_AGENTS,
  WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
  WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
  WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING,
  WAZUH_SAMPLE_INVENTORY_AGENT,
  WAZUH_SAMPLE_SECURITY_CONFIGURATION_ASSESSMENT,
  WAZUH_SAMPLE_METRICS_COMMS,
  WAZUH_SAMPLE_VULNERABILITIES,
  WAZUH_SAMPLE_AGENT_STATS,
} from '../../../common/constants';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { malwareDetection } from '../../utils/applications';
import {
  DeepPromiseResolver,
  sampleFileIntegrityMonitoring,
  sampleInventory,
  sampleMalwareDetection,
  sampleSecurityConfigurationAssessment,
  sampleSecurityInformationApplication,
  sampleThreatDetectionApplication,
} from './helper';
import { GenericRequest } from '../../react-services';
import { i18n } from '@osd/i18n';

export default class WzSampleData extends Component {
  categories: {
    title: string;
    description: string;
    image: string;
    categorySampleDataIndex: string;
  }[];
  generateAlertsParams: Record<string, unknown>;
  state: {
    [name: string]: {
      exists: boolean;
      addDataLoading: boolean;
      removeDataLoading: boolean;
    };
  };
  constructor(props) {
    super(props);
    this.generateAlertsParams = {}; // extra params to add to generateAlerts function in server
    this.categories = [
      {
        title: i18n.translate(
          'wazuh.sampleData.categories.securityInformation.title',
          { defaultMessage: 'Sample security information' },
        ),
        description: i18n.translate(
          'wazuh.sampleData.categories.securityInformation.description',
          {
            defaultMessage:
              'Sample data, visualizations and dashboards for security information ({sources}).',
            values: { sources: sampleSecurityInformationApplication },
          },
        ),
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
      },
      {
        title: i18n.translate(
          'wazuh.sampleData.categories.malwareDetection.title',
          {
            defaultMessage: 'Sample {moduleTitle}',
            values: { moduleTitle: malwareDetection.title.toLowerCase() },
          },
        ),
        description: i18n.translate(
          'wazuh.sampleData.categories.malwareDetection.description',
          {
            defaultMessage:
              'Sample data, visualizations and dashboards for events of {moduleTitle} ({sources}).',
            values: {
              moduleTitle: malwareDetection.title,
              sources: sampleMalwareDetection,
            },
          },
        ),
        image: '',
        categorySampleDataIndex:
          WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
      },
      {
        title: i18n.translate(
          'wazuh.sampleData.categories.threatDetection.title',
          { defaultMessage: 'Sample threat detection and response' },
        ),
        description: i18n.translate(
          'wazuh.sampleData.categories.threatDetection.description',
          {
            defaultMessage:
              'Sample data, visualizations and dashboards for threat events of detection and response ({sources}).',
            values: { sources: sampleThreatDetectionApplication },
          },
        ),
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
      },
      {
        title: i18n.translate(
          'wazuh.sampleData.categories.fileIntegrityMonitoring.title',
          { defaultMessage: 'Sample file integrity monitoring inventory' },
        ),
        description: i18n.translate(
          'wazuh.sampleData.categories.fileIntegrityMonitoring.description',
          {
            defaultMessage:
              'Sample data, visualizations and dashboards for file integrity monitoring inventory ({sources}).',
            values: { sources: sampleFileIntegrityMonitoring },
          },
        ),
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING,
      },
      {
        title: i18n.translate(
          'wazuh.sampleData.categories.configurationAssessment.title',
          { defaultMessage: 'Sample security configuration assessment' },
        ),
        description: i18n.translate(
          'wazuh.sampleData.categories.configurationAssessment.description',
          {
            defaultMessage:
              'Sample data, visualizations and dashboards for security configuration assessment ({sources}).',
            values: { sources: sampleSecurityConfigurationAssessment },
          },
        ),
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_SECURITY_CONFIGURATION_ASSESSMENT,
      },
      {
        title: i18n.translate(
          'wazuh.sampleData.categories.systemInventory.title',
          { defaultMessage: 'Sample system inventory' },
        ),
        description: i18n.translate(
          'wazuh.sampleData.categories.systemInventory.description',
          {
            defaultMessage:
              'Sample data, visualizations and dashboards for system inventory ({sources}).',
            values: { sources: sampleInventory },
          },
        ),
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_INVENTORY_AGENT,
      },
      {
        title: i18n.translate(
          'wazuh.sampleData.categories.vulnerabilities.title',
          { defaultMessage: 'Sample vulnerability detection inventory' },
        ),
        description: i18n.translate(
          'wazuh.sampleData.categories.vulnerabilities.description',
          {
            defaultMessage:
              'Sample data, visualizations and dashboards for vulnerabilities inventory.',
          },
        ),
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_VULNERABILITIES,
      },
      {
        title: i18n.translate(
          'wazuh.sampleData.categories.agentsMonitoring.title',
          { defaultMessage: 'Sample agents monitoring' },
        ),
        description: i18n.translate(
          'wazuh.sampleData.categories.agentsMonitoring.description',
          { defaultMessage: 'Sample data for agents monitoring.' },
        ),
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_METRICS_AGENTS,
      },
      {
        title: i18n.translate(
          'wazuh.sampleData.categories.serverStatistics.title',
          { defaultMessage: 'Sample server statistics' },
        ),
        description: i18n.translate(
          'wazuh.sampleData.categories.serverStatistics.description',
          { defaultMessage: 'Sample data for server statistics.' },
        ),
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_METRICS_COMMS,
      },
      {
        title: i18n.translate(
          'wazuh.sampleData.categories.agentStatistics.title',
          { defaultMessage: 'Sample agent statistics' },
        ),
        description: i18n.translate(
          'wazuh.sampleData.categories.agentStatistics.description',
          { defaultMessage: 'Sample data for the endpoint statistics.' },
        ),
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_AGENT_STATS,
      },
    ];
    this.state = {};
    this.categories.forEach(category => {
      // eslint-disable-next-line react/no-direct-mutation-state
      this.state[category.categorySampleDataIndex] = {
        exists: false,
        addDataLoading: false,
        removeDataLoading: false,
        havePermissions: false,
      };
    });
  }
  async componentDidMount() {
    try {
      // Check if sample data for each category was added
      const results = await DeepPromiseResolver(
        this.categories.reduce((accum, cur) => {
          accum[cur.categorySampleDataIndex] = GenericRequest.request(
            'GET',
            `/indexer/sampledata/${cur.categorySampleDataIndex}`,
          );
          return accum;
        }, {} as Record<string, Promise<any>>),
      );

      this.setState(
        Object.keys(results).reduce(
          (accum, cur) => {
            accum[cur] = {
              ...this.state[cur],
              exists: results[cur].data.exists,
            };
            return accum;
          },
          { ...this.state },
        ),
      );

      // Get information about cluster
      const clusterName = AppState.getClusterInfo().cluster;

      if (!clusterName) {
        throw new Error(
          i18n.translate('wazuh.sampleData.check.missingClusterError', {
            defaultMessage:
              'The data related to the server API context could not be obtained. This is required when adding sample data to match the server API context.',
          }),
        );
      }

      // eslint-disable-next-line camelcase
      this.generateAlertsParams.api_id = JSON.parse(
        AppState.getCurrentAPI() || '{}',
      )?.id;
      this.generateAlertsParams.cluster = {
        name: clusterName,
        node: clusterName,
      };
      this.generateAlertsParams.manager = {
        name: clusterName,
      };

      if (!this.generateAlertsParams.api_id) {
        throw new Error(
          i18n.translate('wazuh.sampleData.check.missingApiError', {
            defaultMessage:
              'The server API is not selected. Select it using the server API selector.',
          }),
        );
      }
    } catch (error) {
      const options = {
        context: `${WzSampleData.name}.componentDidMount`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: i18n.translate('wazuh.sampleData.check.errorTitle', {
            defaultMessage: 'Error checking sample data',
          }),
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }
  showToast(
    color: string,
    title: string = '',
    text: string = '',
    time: number = 3000,
  ) {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  }
  async addSampleData(category) {
    try {
      this.setState({
        [category.categorySampleDataIndex]: {
          ...this.state[category.categorySampleDataIndex],
          addDataLoading: true,
        },
      });
      await WzRequest.genericReq(
        'POST',
        `/indexer/sampledata/${category.categorySampleDataIndex}`,
        { params: this.generateAlertsParams },
      );
      this.showToast(
        'success',
        i18n.translate('wazuh.sampleData.add.successTitle', {
          defaultMessage: '{category} sample data added',
          values: { category: category.title },
        }),
        i18n.translate('wazuh.sampleData.add.successText', {
          defaultMessage: 'Date range for sample data is now-7 days ago',
        }),
        5000,
      );
      this.setState({
        [category.categorySampleDataIndex]: {
          ...this.state[category.categorySampleDataIndex],
          exists: true,
          addDataLoading: false,
        },
      });
    } catch (error) {
      const options = {
        context: `${WzSampleData.name}.addSampleData`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: i18n.translate('wazuh.sampleData.add.errorTitle', {
            defaultMessage: 'Error trying to add sample data',
          }),
        },
      };
      getErrorOrchestrator().handleError(options);
      this.setState({
        [category.categorySampleDataIndex]: {
          ...this.state[category.categorySampleDataIndex],
          addDataLoading: false,
        },
      });
    }
  }
  async removeSampleData(category) {
    try {
      this.setState({
        [category.categorySampleDataIndex]: {
          ...this.state[category.categorySampleDataIndex],
          removeDataLoading: true,
        },
      });
      const { data: deleteResponse } = await WzRequest.genericReq(
        'DELETE',
        `/indexer/sampledata/${category.categorySampleDataIndex}`,
      );
      this.setState({
        [category.categorySampleDataIndex]: {
          ...this.state[category.categorySampleDataIndex],
          exists: false,
          removeDataLoading: false,
        },
      });

      if (deleteResponse?.errors) {
        deleteResponse.errors.forEach(error =>
          this.showToast(
            'danger',
            i18n.translate('wazuh.sampleData.remove.indexErrorTitle', {
              defaultMessage: 'Failed to remove index: {index}',
              values: { index: error.index },
            }),
            i18n.translate('wazuh.sampleData.remove.indexErrorText', {
              defaultMessage: 'Error: {message}',
              values: { message: error.message },
            }),
            5000,
          ),
        );

        if (deleteResponse.indices.length > 0) {
          this.showToast(
            'success',
            i18n.translate('wazuh.sampleData.remove.partialSuccessTitle', {
              defaultMessage: 'Successfully removed {count} indices',
              values: { count: deleteResponse.indices.length },
            }),
            deleteResponse.indices.join(', '),
            5000,
          );
        }
      } else {
        this.showToast(
          'success',
          i18n.translate('wazuh.sampleData.remove.successTitle', {
            defaultMessage: '{category} sample data removed',
            values: { category: category.title },
          }),
          i18n.translate('wazuh.sampleData.remove.successText', {
            defaultMessage: 'All indices were successfully deleted',
          }),
          4000,
        );
      }
    } catch (error) {
      const options = {
        context: `${WzSampleData.name}.removeSampleData`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: i18n.translate('wazuh.sampleData.remove.errorTitle', {
            defaultMessage: 'Error trying to delete sample data',
          }),
        },
      };
      getErrorOrchestrator().handleError(options);
      this.setState({
        [category.categorySampleDataIndex]: {
          ...this.state[category.categorySampleDataIndex],
          removeDataLoading: false,
        },
      });
    }
  }
  renderCard(category) {
    const { addDataLoading, exists, removeDataLoading } =
      this.state[category.categorySampleDataIndex];
    return (
      <EuiFlexItem key={`sample-data-${category.title}`}>
        <EuiCard
          textAlign='left'
          title={category.title}
          description={category.description}
          image={category.image}
          betaBadgeLabel={
            exists
              ? i18n.translate('wazuh.sampleData.card.installedBadge', {
                  defaultMessage: 'Installed',
                })
              : undefined
          }
          footer={
            <EuiFlexGroup justifyContent='flexEnd'>
              <EuiFlexItem grow={false}>
                {(exists && (
                  <WzButtonPermissions
                    color='danger'
                    administrator
                    onClick={() => this.removeSampleData(category)}
                  >
                    {(removeDataLoading &&
                      i18n.translate('wazuh.sampleData.card.removingButton', {
                        defaultMessage: 'Removing data',
                      })) ||
                      i18n.translate('wazuh.sampleData.card.removeButton', {
                        defaultMessage: 'Remove data',
                      })}
                  </WzButtonPermissions>
                )) || (
                  <WzButtonPermissions
                    isLoading={addDataLoading}
                    administrator
                    onClick={() => this.addSampleData(category)}
                  >
                    {(addDataLoading &&
                      i18n.translate('wazuh.sampleData.card.addingButton', {
                        defaultMessage: 'Adding data',
                      })) ||
                      i18n.translate('wazuh.sampleData.card.addButton', {
                        defaultMessage: 'Add data',
                      })}
                  </WzButtonPermissions>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          }
        />
      </EuiFlexItem>
    );
  }
  render() {
    return (
      <>
        <EuiCallOut
          title={i18n.translate('wazuh.sampleData.permissionsCallout.title', {
            defaultMessage:
              'These actions require permissions on the managed indices.',
          })}
          iconType='iInCircle'
        />
        <EuiSpacer />
        <EuiFlexGrid columns={3}>
          {this.categories.map(category => this.renderCard(category))}
        </EuiFlexGrid>
      </>
    );
  }
}
