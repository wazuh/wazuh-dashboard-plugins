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
  WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
  WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
  WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING,
  WAZUH_SAMPLE_INVENTORY_AGENT,
  WAZUH_SAMPLE_VULNERABILITIES,
} from '../../../common/constants';
import { getErrorOrchestrator } from '../../react-services/common-services';
import {
  amazonWebServices,
  docker,
  fileIntegrityMonitoring,
  github,
  googleCloud,
  malwareDetection,
  mitreAttack,
  office365,
  vulnerabilityDetection,
} from '../../utils/applications';

const sampleSecurityInformationApplication = [
  fileIntegrityMonitoring.title,
  amazonWebServices.title,
  office365.title,
  googleCloud.title,
  github.title,
  'authorization',
  'ssh',
  'web',
].join(', ');

const sampleThreatDetectionApplication = [
  vulnerabilityDetection.title,
  docker.title,
  mitreAttack.title,
].join(', ');

const sampleMalwareDetection = ['malware', 'VirusTotal', 'YARA'].join(', ');

const sampleFileIntegrityMonitoring = ['files', 'registries'].join(', ');

const sampleInventory = [
  'hardware',
  'hotfixes',
  'interfaces',
  'networks',
  'packages',
  'ports',
  'processes',
  'protocols',
  'system',
].join(', ');

export default class WzSampleData extends Component {
  categories: {
    title: string;
    description: string;
    image: string;
    categorySampleDataIndex: string;
  }[];
  generateAlertsParams: any;
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
        title: 'Sample security information',
        description: `Sample data, visualizations and dashboards for security information (${sampleSecurityInformationApplication}).`,
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
      },
      {
        title: `Sample ${malwareDetection.title}`,
        description: `Sample data, visualizations and dashboards for events of ${malwareDetection.title} (${sampleMalwareDetection}).`,
        image: '',
        categorySampleDataIndex:
          WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
      },
      {
        title: 'Sample threat detection and response',
        description: `Sample data, visualizations and dashboards for threat events of detection and response (${sampleThreatDetectionApplication}).`,
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
      },
      {
        title: 'Sample file integrity monitoring inventory',
        description: `Sample data, visualizations and dashboards for file integrity monitoring inventory (${sampleFileIntegrityMonitoring}).`,
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING,
      },
      {
        title: 'Sample system inventory',
        description: `Sample data, visualizations and dashboards for system inventory (${sampleInventory}).`,
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_INVENTORY_AGENT,
      },
      {
        title: 'Sample vulnerability detection inventory',
        description: `Sample data, visualizations and dashboards for vulnerabilities inventory.`,
        image: '',
        categorySampleDataIndex: WAZUH_SAMPLE_VULNERABILITIES,
      },
    ];
    this.state = {};
    this.categories.forEach(category => {
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
      try {
        const results = await PromiseAllRecursiveObject(
          this.categories.reduce((accum, cur) => {
            accum[cur.categorySampleDataIndex] = WzRequest.genericReq(
              'GET',
              `/indexer/sampledata/${cur.categorySampleDataIndex}`,
            );
            return accum;
          }, {}),
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
      } catch (error) {
        throw error;
      }

      // Get information about cluster/manager
      try {
        const clusterName = AppState.getClusterInfo().cluster;
        const managerName = AppState.getClusterInfo().manager;
        this.generateAlertsParams.manager = {
          name: managerName,
        };
        if (clusterName && clusterName !== 'Disabled') {
          this.generateAlertsParams.cluster = {
            name: clusterName,
            node: clusterName,
          };
        }
      } catch (error) {
        throw error;
      }
    } catch (error) {
      const options = {
        context: `${WzSampleData.name}.componentDidMount`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: 'Error checking sample data',
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
        `${category.title} sample data added`,
        'Date range for sample data is now-7 days ago',
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
          title: `Error trying to add sample data`,
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
            `Failed to remove index: ${error.index}`,
            `Error: ${error.message}`,
            5000,
          ),
        );

        if (deleteResponse.indices.length > 0) {
          this.showToast(
            'success',
            `Successfully removed ${deleteResponse.indices.length} indices`,
            deleteResponse.indices.join(', '),
            5000,
          );
        }
      } else {
        this.showToast(
          'success',
          `${category.title} sample data removed`,
          'All indices were successfully deleted',
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
          title: `Error trying to delete sample data`,
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
          betaBadgeLabel={exists ? 'Installed' : undefined}
          footer={
            <EuiFlexGroup justifyContent='flexEnd'>
              <EuiFlexItem grow={false}>
                {(exists && (
                  <WzButtonPermissions
                    color='danger'
                    administrator
                    onClick={() => this.removeSampleData(category)}
                  >
                    {(removeDataLoading && 'Removing data') || 'Remove data'}
                  </WzButtonPermissions>
                )) || (
                  <WzButtonPermissions
                    isLoading={addDataLoading}
                    administrator
                    onClick={() => this.addSampleData(category)}
                  >
                    {(addDataLoading && 'Adding data') || 'Add data'}
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
          title='These actions require permissions on the managed indices.'
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

const zipObject = (keys = [], values = []) => {
  return keys.reduce((accumulator, key, index) => {
    accumulator[key] = values[index];
    return accumulator;
  }, {});
};

const PromiseAllRecursiveObject = function (obj) {
  const keys = Object.keys(obj);
  return Promise.all(
    keys.map(key => {
      const value = obj[key];
      // Promise.resolve(value) !== value should work, but !value.then always works
      if (typeof value === 'object' && !value.then) {
        return PromiseAllRecursiveObject(value);
      }
      return value;
    }),
  ).then(result => zipObject(keys, result));
};
