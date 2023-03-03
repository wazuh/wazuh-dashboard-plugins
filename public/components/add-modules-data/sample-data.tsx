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
import { i18n } from '@kbn/i18n';
import React, { Component, Fragment } from 'react';
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
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../common/constants';

import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { getErrorOrchestrator } from '../../react-services/common-services';

const addingData = i18n.translate(
  'wazuh.components.add.modules.sample.data.title1',
  {
    defaultMessage: "'Adding data'",
  },
);
const addData = i18n.translate(
  'wazuh.components.add.modules.sample.data.title2',
  {
    defaultMessage: 'Add data',
  },
);
const removingData = i18n.translate(
  'wazuh.components.add.modules.sample.data.title3',
  {
    defaultMessage: 'Removing data',
  },
);
const removeData = i18n.translate(
  'wazuh.components.add.modules.sample.data.title4',
  {
    defaultMessage: 'Remove data',
  },
);
export default class WzSampleData extends Component {
  categories: {
    title: string;
    description: string;
    image: string;
    categorySampleAlertsIndex: string;
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
        title: i18n.translate(
          'wazuh.components.addModulesData.sampleSecurityTitle',
          {
            defaultMessage: 'Sample security information',
          },
        ),
        description: i18n.translate(
          'wazuh.component.addModulesData.sampleSecurityDescription',
          {
            defaultMessage:
              'Sample data, visualizations and dashboards for security information (integrity monitoring, Amazon AWS services, Office 365, Google Cloud Platform, GitHub, authorization, ssh, web).',
          },
        ),
        image: '',
        categorySampleAlertsIndex: 'security',
      },
      {
        title: i18n.translate(
          'wazuh.component.addModulesData.sampleAuditingPolicyTitle',
          {
            defaultMessage: 'Sample auditing and policy monitoring',
          },
        ),
        description: i18n.translate(
          'wazuh.component.addModulesData.sampleAuditingPolicyDescription',
          {
            defaultMessage:
              'Sample data, visualizations and dashboards for events of auditing and policy monitoring (policy monitoring, system auditing, OpenSCAP, CIS-CAT).',
          },
        ),
        image: '',
        categorySampleAlertsIndex: 'auditing-policy-monitoring',
      },
      {
        title: i18n.translate(
          'wazuh.component.addModulesData.sampleThreatDetectionTitle',
          {
            defaultMessage: 'Sample threat detection and response',
          },
        ),
        description: i18n.translate(
          'wazuh.component.addModulesData.sampleThreatDetectionDescription',
          {
            defaultMessage:
              'Sample data, visualizations and dashboards for threat events of detection and response (vulnerabilities, VirusTotal, Osquery, Docker listener, MITRE).',
          },
        ),
        image: '',
        categorySampleAlertsIndex: 'threat-detection',
      },
    ];
    this.state = {};
    this.categories.forEach(category => {
      this.state[category.categorySampleAlertsIndex] = {
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
            accum[cur.categorySampleAlertsIndex] = WzRequest.genericReq(
              'GET',
              `/elastic/samplealerts/${cur.categorySampleAlertsIndex}`,
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
          title: i18n.translate('wazuh.components.modules.wz.sampleDataError', {
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
        [category.categorySampleAlertsIndex]: {
          ...this.state[category.categorySampleAlertsIndex],
          addDataLoading: true,
        },
      });
      await WzRequest.genericReq(
        'POST',
        `/elastic/samplealerts/${category.categorySampleAlertsIndex}`,
        { params: this.generateAlertsParams },
      );
      const alertAdded = i18n.translate(
        'wazuh.components.addModulesData.alertAdded',
        {
          defaultMessage: 'Sample security information',
        },
      );
      this.showToast(
        'success',
        `${category.title} ${alertAdded}`,
        i18n.translate('wazuh.components.addModulesData.alertForDateRange', {
          defaultMessage: 'Date range for sample data is now-7 days ago',
        }),
        5000,
      );
      this.setState({
        [category.categorySampleAlertsIndex]: {
          ...this.state[category.categorySampleAlertsIndex],
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
          title: i18n.translate(
            'wazuh.components.addModulesData.errorAddSampleData',
            {
              defaultMessage: 'Error trying to add sample data',
            },
          ),
        },
      };
      getErrorOrchestrator().handleError(options);
      this.setState({
        [category.categorySampleAlertsIndex]: {
          ...this.state[category.categorySampleAlertsIndex],
          addDataLoading: false,
        },
      });
    }
  }
  async removeSampleData(category) {
    try {
      this.setState({
        [category.categorySampleAlertsIndex]: {
          ...this.state[category.categorySampleAlertsIndex],
          removeDataLoading: true,
        },
      });
      await WzRequest.genericReq(
        'DELETE',
        `/elastic/samplealerts/${category.categorySampleAlertsIndex}`,
      );
      this.setState({
        [category.categorySampleAlertsIndex]: {
          ...this.state[category.categorySampleAlertsIndex],
          exists: false,
          removeDataLoading: false,
        },
      });
      const alertRemove = i18n.translate(
        'wazuh.component.addModulesData.alertRemove',
        {
          defaultMessage: 'alerts removed',
        },
      );
      this.showToast('success', `${category.title} ${alertRemove}`);
    } catch (error) {
      const options = {
        context: `${WzSampleData.name}.removeSampleData`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: i18n.translate(
            'wazuh.components.addModulesData.errorDeleteSampleData',
            {
              defaultMessage: 'Error trying to delete sample data',
            },
          ),
        },
      };
      getErrorOrchestrator().handleError(options);
      this.setState({
        [category.categorySampleAlertsIndex]: {
          ...this.state[category.categorySampleAlertsIndex],
          removeDataLoading: false,
        },
      });
    }
  }
  renderCard(category) {
    const { addDataLoading, exists, removeDataLoading } =
      this.state[category.categorySampleAlertsIndex];
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
                    roles={[WAZUH_ROLE_ADMINISTRATOR_NAME]}
                    onClick={() => this.removeSampleData(category)}
                  >
                    {(removeDataLoading && removingData) || removeData}
                  </WzButtonPermissions>
                )) || (
                  <WzButtonPermissions
                    isLoading={addDataLoading}
                    roles={[WAZUH_ROLE_ADMINISTRATOR_NAME]}
                    onClick={() => this.addSampleData(category)}
                  >
                    {(addDataLoading && addingData) || addData}
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
          title={i18n.translate(
            'wazuh.components.addModulesData.permissionRequireForAction',
            {
              defaultMessage:
                'These actions require permissions on the managed indices.',
            },
          )}
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
