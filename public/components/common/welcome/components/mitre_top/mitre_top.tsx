/*
 * Wazuh app - React component information about last SCA scan.
 *
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
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiListGroup,
  EuiListGroupItem,
  EuiText
} from '@elastic/eui';
import { IFilterParams, getElasticAlerts } from '../../../../../components/overview/mitre/lib';

export class MitreTopTactics extends Component {
  _isMount = false;
  props!: {
      [key: string]: any
  }
  state: {
    isLoading: boolean,
    tacticsCount: { key: string, doc_count:number }[],
  }

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      tacticsCount: [],

    };
  }

  async componentDidMount() {
    this._isMount = true;
    this.getTacticsCount();
    console.log(this.state);
  }

  async getTacticsCount(firstTime=false) {
    this.setState({loadingAlerts: true, prevFilters: this.props.filterParams});
    try{
      const {indexPattern, filterParams} = this.props;
      if ( !indexPattern ) { return; }
      const aggs = {
        tactics: {
          terms: {
              field: "rule.mitre.tactics",
              size: 5,
          }
        }
      }
      
      // TODO: use `status` and `statusText`  to show errors
      // @ts-ignore
      const {data, status, statusText, } = await getElasticAlerts(indexPattern, filterParams, aggs);
      const { buckets } = data.aggregations.tactics;
      if(firstTime){
       this.initTactics(buckets); // top tactics are checked on component mount
      }
      this._isMount && this.setState({tacticsCount: buckets, loadingAlerts: false, firstTime:false});
        
    } catch(err){
      this.showToast(
        'danger',
        'Error',
        `Mitre alerts could not be fetched: ${err}`,
        3000
      );
      this.setState({loadingAlerts: false})
    }
    
  }

  render() {
    return (
      <Fragment>
        <EuiText size="xs">
          <EuiFlexGroup>
            <EuiFlexItem>
              <h3>Top Tactics</h3>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiText>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiListGroup>
              <EuiListGroupItem label="First item" />
              <EuiListGroupItem label="Second item"/>
              <EuiListGroupItem label="Third item" />
            </EuiListGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    );
  }
}