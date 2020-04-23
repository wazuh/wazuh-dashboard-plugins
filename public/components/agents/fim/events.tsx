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
    isFlyoutVisible: Boolean,
    elements: HTMLElement[],
    currentFile: string
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
      elements: [],
      currentFile: ''
    };
    this.modulesHelper = ModulesHelper;
  }

  async getRowsField(scope) {
    const indices: number[] = [];
    if (!document)
      this.getRowsField(scope);
    const cols = document.querySelectorAll(`.kbn-table thead th`);
    if (!(cols || []).length) {
      setTimeout(() => { this.getRowsField(scope) }, 1000);
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
      if ((scope.rows || []).length && (elements || {}).length) {
        this.setState({elements});
      } else if ((scope.rows || []).length) {
        setTimeout(() => { this.getRowsField(scope) }, 1000);
      }
    }
  }

  async componentDidMount() {
    const scope = await this.modulesHelper.getDiscoverScope();
    this.fetchWatch = scope.$watchCollection('fetchStatus',
      () => {
        if (scope.fetchStatus === 'complete') {
          this.setState({elements:[]}, () => setTimeout(() => { this.getRowsField(scope) }, 1000));
        }
      });
  }

  componentWillUnmount() {
    if (this.fetchWatch) this.fetchWatch();
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
    const { elements } = this.state;
    console.log(elements)
    return (
      <Fragment>
        {
          [...elements].map((element, idx) => {
            const text = element.textContent;
            element.childNodes.forEach(child => {
              if (child.nodeName === 'SPAN') {
                // @ts-ignore
                child.setAttribute('style', `display: none`)
              }
            })
            if(element.childNodes.length < 2) {
                return (
                  idx % 2 
                  ? (
                    ReactDOM.createPortal(
                      <a
                        href={`#/manager/rules?tab=rules&redirectRule=${text}`} target="_blank"
                        style={{ minWidth: 55, display: 'block' }}>
                        {text}
                      </a>
                      ,
                      element
                    )
                  )
                  : (
                    ReactDOM.createPortal(
                      <a
                        onClick={() => this.showFlyout(text)}>
                        {text}
                      </a>
                      ,
                      element
                    )
                  )
                )
              }
          })
        }
        {this.state.isFlyoutVisible &&
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
        }
      </Fragment>
    )
  }
}
