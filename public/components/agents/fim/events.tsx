/*
 * Wazuh app - Integrity monitoring components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component } from 'react';
import { FlyoutDetail } from './states/flyout';
import { ModulesHelper } from '../../common/modules/modules-helper'
import { EuiOverlayMask } from '@elastic/eui';


export class EventsFim extends Component {
  _isMount = false;
  state: {
    isFlyoutVisible: Boolean,
    currentFile: string,
    fetchStatus: 'loading' | 'complete',
    rows: number
  };
  props!: {
    [key: string]: any
  }
  modulesHelper: ModulesHelper;
  fetchWatch!: any;
  
  constructor(props) {
    super(props);
    this.state = {
      isFlyoutVisible: false,
      currentFile: '',
      fetchStatus: 'loading',
      rows: 0
    };
    this.modulesHelper = ModulesHelper;
    this.getRowsField.bind(this);
  }

  async componentDidMount() {
    this._isMount = true;
    const scope = await this.modulesHelper.getDiscoverScope();
    this.fetchWatch = scope.$watchCollection('fetchStatus',
      () => {
        const {fetchStatus} = this.state;
        if (fetchStatus !== scope.fetchStatus){
          const rows = scope.fetchStatus === 'complete' ? scope.rows.length : 0;
          this._isMount && this.setState({fetchStatus: scope.fetchStatus, rows})
        }
      });
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {fetchStatus, isFlyoutVisible, rows} = this.state;
    if (nextState.isFlyoutVisible !== isFlyoutVisible ){
      return true;
    }
    if (nextState.fetchStatus !== fetchStatus){
      return true;
    }
    if (nextState.rows !== rows) {
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    const {fetchStatus, rows} = this.state;
    if(fetchStatus === 'complete' && rows){
      this.getRowsField();
    }
  }

  componentWillUnmount() {
    this._isMount = false;
    if (this.fetchWatch) this.fetchWatch();
  }

  getRowsField = async () => {
    const indices: number[] = [];
    const { rows } = this.state;
    if (!rows) {
      this.setState({elements:[]})
      return;
    }
    if (!document)
      this.getRowsField();
    const cols = document.querySelectorAll(`.kbn-table thead th`);
    if (!(cols || []).length) {
      setTimeout(this.getRowsField, 10);
    }
    cols.forEach((col, idx) => {
      if (['syscheck.path', 'rule.id'].includes(col.textContent || '')) {
        indices.push(idx + 1);
      }
    });
    let query = '';
    indices.forEach((position, idx) => {
      query += `.kbn-table tbody tr td:nth-child(${position}) div`
      if (idx !== indices.length - 1) {
        query += ', ';
      }
    });
    if (query){
      const elements = document.querySelectorAll(query);
        elements.forEach((element, idx) => {
          const text = element.textContent;
          if (idx % 2){
            element.childNodes.forEach(child => {
              if (child.nodeName === 'SPAN'){
                const link = document.createElement('a')
                link.setAttribute('href', `#/manager/rules?tab=rules&redirectRule=${text}`)
                link.setAttribute('target', '_blank')
                link.setAttribute('style', 'minWidth: 55, display: "block"');
                link.textContent = text
                child.replaceWith(link)
              }
            })
          } else {
            element.childNodes.forEach(child => {
              if (child.nodeName === 'SPAN'){
                const link = document.createElement('a')
                link.onclick = () => this.showFlyout(text);
                link.textContent = text
                child.replaceWith(link);
              }
            })
          }
        })
    }
  }

  showFlyout(file) {
    if (file !== " - ") {
      //if a flyout is opened, we close it and open a new one, so the components are correctly updated on start.
      this.setState({ isFlyoutVisible: true, currentFile: file });
    }
  }

  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentFile: false });
  }

  render() {
    return (
      this.state.isFlyoutVisible &&
      <EuiOverlayMask 
      // @ts-ignore
        onClick={(e:Event) => {e.target.className === 'euiOverlayMask' && this.closeFlyout() }} >
        <FlyoutDetail
          fileName={this.state.currentFile}
          agentId={this.props.agent.id}
          closeFlyout={() => this.closeFlyout()}
          type='file'
          view='events'
          {...this.props}/>
      </EuiOverlayMask>
    )
  }
}
