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

import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import { FlyoutDetail } from './states/flyout';
import { ModulesHelper } from '../../common/modules/modules-helper'
import { EuiOverlayMask } from '@elastic/eui';
export class EventsFim extends Component {
  state: {
    isFlyoutVisible: Boolean
  };
  constructor(props) {
    super(props);
    this.state = {
      isFlyoutVisible: false,
    };
    this.modulesHelper = ModulesHelper;
  }

  async getRowsField(scope) {
    this.indices = [];
    if (!document)
      this.getRowsField(scope);
    this.cols = document.querySelectorAll(`.kbn-table thead th`);
    if (!(this.cols || []).length) {
      setTimeout(() => { this.getRowsField(scope) }, 1000);
    }
    this.cols.forEach((col, idx) => {
      if (['syscheck.path', 'rule.id'].includes(col.textContent)) {
        this.indices.push(idx + 1);
      }
    });
    let query = '';
    this.indices.forEach((position, idx) => {
      query += `.kbn-table tbody tr td:nth-child(${position}) div`
      if (idx !== this.indices.length - 1) {
        query += ', ';
      }
    });
    if (query)
      this.elements = document.querySelectorAll(query);
    if ((scope.rows || []).length && (this.elements || {}).length) {
      this.forceUpdate();
    } else if ((scope.rows || []).length) {
      setTimeout(() => { this.getRowsField(scope) }, 1000);
    }
  }

  async componentDidMount() {
    this.scope = await this.modulesHelper.getDiscoverScope();
    this.fetchWatch = this.scope.$watchCollection('fetchStatus',
      () => {
        if (this.scope.fetchStatus === 'complete') {
          this.elements = false;
          setTimeout(() => { this.getRowsField(this.scope) }, 1000);
        }
      });
  }

  componentWillUnmount() {
    if (this.fetchWatch) this.fetchWatch();
  }

  showFlyout(file) {
    if (file !== " - ") {
      //if a flyout is opened, we close it and open a new one, so the components are correctly updated on start.
      this.setState({ isFlyoutVisible: false }, () => this.setState({ isFlyoutVisible: true, currentFile: file }));
    }
  }

  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentFile: false });
  }

  render() {
    return (
      <Fragment>
        {(this.elements && this.elements[0].firstChild) &&
          [...this.elements].map((element, idx) => {
            const text = element.textContent;
            if ((element.firstChild || {}).tagName === 'SPAN') {
              element.removeChild(element.firstChild);
            }
            return (
              idx % 2 && (
                ReactDOM.createPortal(
                  <Fragment>
                    <a
                      href={`#/manager/rules?tab=rules&redirectRule=${text}`} target="_blank"
                      style={{ minWidth: 55, display: 'block' }}>
                      {text}
                    </a>
                  </Fragment>
                  ,
                  element
                )
              ) || (
                ReactDOM.createPortal(
                  <Fragment>
                    <a
                      onClick={() => this.showFlyout(text)}>
                      {text}
                    </a>
                  </Fragment>
                  ,
                  element
                )
              )
            )
          }
          )
        }
        {this.state.isFlyoutVisible &&
          <EuiOverlayMask 
            onClick={(e:Event) => {e.target.className === 'euiOverlayMask' && this.closeFlyout() }} >
            <FlyoutDetail
              fileName={this.state.currentFile}
              agentId={this.props.agent.id}
              closeFlyout={() => this.closeFlyout()}
              type='file'
              {...this.props}/>
          </EuiOverlayMask>
        }
      </Fragment>
    )
  }
}
