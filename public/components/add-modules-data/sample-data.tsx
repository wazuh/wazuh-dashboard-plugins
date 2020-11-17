/*
 * Wazuh app - React component for add sample data
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import { WzButtonPermissions } from '../../components/common/permissions/button';

import {
    EuiFlexItem,
    EuiCard,
    EuiSpacer,
    EuiFlexGrid,
    EuiFlexGroup,
    EuiButton,
    EuiButtonEmpty,
    EuiTitle,
    EuiToolTip,
    EuiButtonIcon
} from '@elastic/eui';

import { toastNotifications } from 'ui/notify';
import { WzRequest } from '../../react-services/wz-request';
import { AppState } from '../../react-services/app-state';
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../util/constants';
import { getIndexPattern } from '../overview/mitre/lib';

export default class WzSampleData extends Component {
  categories: {title: string, description: string, image: string, categorySampleAlertsIndex: string}[]
  generateAlertsParams: any
  state: {
    [name: string]: {
      exists: boolean
      addDataLoading: boolean
      removeDataLoading: boolean
    }
  }
  constructor(props){
    super(props);
    this.generateAlertsParams = {}; // extra params to add to generateAlerts function in server
    this.categories = [
      {
        title: 'Sample security information',
        description: 'Sample data, visualizations and dashboards for security information (integrity monitoring, Amazon AWS services, Google Cloud Platform, authorization, ssh, web).',
        image: '',
        categorySampleAlertsIndex: 'security'
      },
      {
        title: 'Sample auditing and policy monitoring',
        description: 'Sample data, visualizations and dashboards for events of auditing and policy monitoring (policy monitoring, system auditing, OpenSCAP, CIS-CAT).',
        image: '',
        categorySampleAlertsIndex: 'auditing-policy-monitoring'
      },
      {
        title: 'Sample threat detection and response',
        description: 'Sample data, visualizations and dashboards for threat events of detection and response (vulnerabilities, VirustTotal, Osquery, Docker listener, MITRE).',
        image: '',
        categorySampleAlertsIndex: 'threat-detection'
      }
    ];
    this.state = {};
    this.categories.forEach(category => {
      this.state[category.categorySampleAlertsIndex] = {
        exists: false,
        addDataLoading: false,
        removeDataLoading: false
      }
    });
  }
  async componentDidMount(){
    // Check if sample data for each category was added
    try{
      const indexPattern = await getIndexPattern();
      this.setState({indexPattern});
      const results = await PromiseAllRecursiveObject(this.categories.reduce((accum, cur) => {
        accum[cur.categorySampleAlertsIndex] = WzRequest.genericReq('GET', `/elastic${indexPattern}/samplealerts/${cur.categorySampleAlertsIndex}`)
        return accum
      },{}));
  
      this.setState(Object.keys(results).reduce((accum, cur) => {
        accum[cur] = {
          ...this.state[cur],
          exists: results[cur].data.exists
        }
        return accum
      },{...this.state}));
    }catch(error){}

    // Get information about cluster/manager
    try{
      const clusterName = AppState.getClusterInfo().cluster;
      const managerName =  AppState.getClusterInfo().manager;
      this.generateAlertsParams.manager = {
        name: managerName
      };
      if (clusterName && clusterName !== 'Disabled') {
        this.generateAlertsParams.cluster = {
          name: clusterName,
          node: clusterName
        };
      };
      
    }catch(error){}
  }
  showToast(color: string, title: string = '', text: string = '', time: number = 3000){
    toastNotifications.add({
        color: color,
        title: title,
        text: text,
        toastLifeTimeMs: time,
    });
  };
  async addSampleData(category) {
    try{
      this.setState({ [category.categorySampleAlertsIndex]: {
        ...this.state[category.categorySampleAlertsIndex],
        addDataLoading: true
      } });
      await WzRequest.genericReq('POST', `/elastic/${this.state.indexPattern}/samplealerts/${category.categorySampleAlertsIndex}`, { params: this.generateAlertsParams });
      this.showToast('success', `${category.title} alerts installed`, 'Date range for sample data is now-7 days ago', 5000);
      this.setState({ [category.categorySampleAlertsIndex]: {
        ...this.state[category.categorySampleAlertsIndex],
        exists: true,
        addDataLoading: false
      } });
    }catch(error){
      this.showToast('danger', 'Error', error.message || error);
      this.setState({ [category.categorySampleAlertsIndex]: {
        ...this.state[category.categorySampleAlertsIndex],
        addDataLoading: false
      } });
    }
  }
  async removeSampleData(category){
    try{
      this.setState({ [category.categorySampleAlertsIndex]: {
        ...this.state[category.categorySampleAlertsIndex],
        removeDataLoading: true
      } });
      await WzRequest.genericReq('DELETE', `/elastic/${this.state.indexPattern}/samplealerts/${category.categorySampleAlertsIndex}` );
      this.setState({ [category.categorySampleAlertsIndex]: {
        ...this.state[category.categorySampleAlertsIndex],
        exists: false,
        removeDataLoading: false
      } });
      this.showToast('success', `${category.title} alerts uninstalled`);
    }catch(error){
      this.setState({ [category.categorySampleAlertsIndex]: {
        ...this.state[category.categorySampleAlertsIndex],
        removeDataLoading: false
      } });
      this.showToast('danger', 'Error', error.message || error);
    }
  }
  renderCard(category){
    const { addDataLoading, exists, removeDataLoading } = this.state[category.categorySampleAlertsIndex];
    return (
      <EuiFlexItem key={`sample-data-${category.title}`}>
        <EuiCard
          textAlign='left'
          title={category.title}
          description={category.description}
          image={category.image}
          betaBadgeLabel={exists ? 'Installed' : undefined}
          footer={(
            <EuiFlexGroup justifyContent="flexEnd">
              <EuiFlexItem grow={false}>
                {exists && (
                <WzButtonPermissions
                  color='danger'
                  roles={[WAZUH_ROLE_ADMINISTRATOR_NAME]}
                  onClick={() => this.removeSampleData(category)}
                >
                 {removeDataLoading && 'Removing data' || 'Remove data'}
                </WzButtonPermissions>
                ) || (
                  <WzButtonPermissions
                    isLoading={addDataLoading}
                    roles={[WAZUH_ROLE_ADMINISTRATOR_NAME]}
                    onClick={() => this.addSampleData(category)}
                  >
                   {addDataLoading && 'Adding data' || 'Add data'}
                  </WzButtonPermissions>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
        />
      </EuiFlexItem>
    )
  }
  render() {
    return(
      <EuiFlexGrid columns={3}>
        {this.categories.map(category => this.renderCard(category))}
      </EuiFlexGrid>
    )
  }
}

const zipObject = (keys = [], values = []) => {
  return keys.reduce((accumulator, key, index) => {
    accumulator[key] = values[index]
    return accumulator
  }, {})
}

const PromiseAllRecursiveObject = function (obj) {
  const keys = Object.keys(obj);
  return Promise.all(keys.map(key => {
    const value = obj[key];
    // Promise.resolve(value) !== value should work, but !value.then always works
    if (typeof value === 'object' && !value.then) {
      return PromiseAllRecursiveObject(value);
    }
    return value;
  }))
    .then(result => zipObject(keys, result));
};