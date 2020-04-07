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

export class SampleData extends Component {
  categories: {title: string, description: string, categorySampleAlertsIndex: string}[]
  state: {[name: string]: {
    exists: boolean
    addDataLoading: boolean
    removeDataLoading: boolean
  }}
  generateAlertsParams: any
  constructor(props){
    super(props);
    this.generateAlertsParams = {}; // extra params to add to generateAlerts function in server
    this.categories = [
      {
        title: 'Security Information',
        description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque, quas enim! Commodi, obcaecati quis ea ducimus vel reprehenderit, dolor distinctio quaerat.',
        categorySampleAlertsIndex: 'security'
      },
      {
        title: 'Auditing and Policy Monitoring',
        description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque, quas enim! Commodi, obcaecati quis ea ducimus vel reprehenderit, dolor distinctio quaerat.',
        categorySampleAlertsIndex: 'auditing-pm'
      },
      {
        title: 'Threat detection and response',
        description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque, quas enim! Commodi, obcaecati quis ea ducimus vel reprehenderit, dolor distinctio quaerat.',
        categorySampleAlertsIndex: 'threat-detection'
      },
      {
        title: 'Regulatory Compliance',
        description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque, quas enim! Commodi, obcaecati quis ea ducimus vel reprehenderit, dolor distinctio quaerat.',
        categorySampleAlertsIndex: 'regulatory-compliance'
      },
    ];
    this.state = {};
    this.categories.forEach(category => {
      this.state[`${category.categorySampleAlertsIndex}`] = {
        exists: false,
        addDataLoading: false,
        removeDataLoading: false
      }
    });
  }
  async componentDidMount(){
    // Check if sample data for each category was added
    const results = await PromiseAllRecusiveObject(this.categories.reduce((accum, cur) => {
      accum[cur.categorySampleAlertsIndex] = WzRequest.genericReq('GET', `/elastic/samplealerts/${cur.categorySampleAlertsIndex}`)
      return accum
    },{}));

    this.setState(Object.keys(results).reduce((accum, cur) => {
      accum[cur] = {
        ...this.state[cur],
        exists: results[cur].data.exists
      }
      return accum
    },{...this.state}));

    // Get values of cluster/manager
    try{
      const managerInfo = await WzRequest.apiReq('GET', `/manager/info`, {});
      this.generateAlertsParams.manager = {
        name: managerInfo.data.data.name
      }
      this.generateAlertsParams.cluster = {
        name: managerInfo.data.data.cluster.name
      } 
      
    }catch(error){

    }
  }
  showToast = (color: string, title: string = '', text: string = '', time: number = 3000) => {
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
      await WzRequest.genericReq('POST', '/elastic/samplealerts', { category: category.categorySampleAlertsIndex, params: this.generateAlertsParams });
      this.showToast('success', `${category.title} alerts installed`);
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
      await WzRequest.genericReq('DELETE', '/elastic/samplealerts', { category: category.categorySampleAlertsIndex } );
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
          betaBadgeLabel={exists ? 'Installed' : undefined}
          footer={(
            <Fragment>
              {exists && (
                <EuiFlexGroup justifyContent="spaceBetween">
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      isLoading={removeDataLoading}
                      color='danger'
                      onClick={() => this.removeSampleData(category)}>
                        {addDataLoading && 'Removing data' || 'Remove'}
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      isLoading={removeDataLoading}
                      onClick={() => alert('view data')}>
                        View data
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              ) || (
              <EuiFlexGroup justifyContent="flexEnd">
                <EuiFlexItem grow={false}>
                  <EuiButton
                    isLoading={addDataLoading}
                    onClick={() => this.addSampleData(category)}>
                      {addDataLoading && 'Adding data' || 'Add data'}
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
              )}
            </Fragment>
          )}
        />
      </EuiFlexItem>
    )
  }
  render() {
    return(
      <Fragment>
        <EuiFlexGrid columns={3}>
          {this.categories.map(category => this.renderCard(category))}
        </EuiFlexGrid>
      </Fragment>
    )
  }
}

const zipObject = (keys = [], values = []) => {
  return keys.reduce((accumulator, key, index) => {
    accumulator[key] = values[index]
    return accumulator
  }, {})
}

const PromiseAllRecusiveObject = function (obj) {
  const keys = Object.keys(obj);
  return Promise.all(keys.map(key => {
    const value = obj[key];
    // Promise.resolve(value) !== value should work, but !value.then always works
    if (typeof value === 'object' && !value.then) {
      return PromiseAllRecusiveObject(value);
    }
    return value;
  }))
    .then(result => zipObject(keys, result));
};