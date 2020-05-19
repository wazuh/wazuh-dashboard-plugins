/*
 * Wazuh app - MITRE event component
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
import { ModulesHelper } from '../../common/modules/modules-helper'
import { EuiOverlayMask } from '@elastic/eui';
import {FlyoutTechnique} from '../../overview/mitre/components/techniques/components/flyout-technique'


export class EventsMitre extends Component {
  _isMount = false;
  state: {
    isFlyoutVisible: Boolean,
    currentTechnique: string,
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
      currentTechnique: '',
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
        const { fetchStatus } = this.state;
        if (fetchStatus !== scope.fetchStatus) {
          const rows = scope.fetchStatus === 'complete' ? scope.rows.length : 0;
          this._isMount && this.setState({ fetchStatus: scope.fetchStatus, rows })
        }
      });
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { fetchStatus, isFlyoutVisible, rows } = this.state;
    if (nextState.isFlyoutVisible !== isFlyoutVisible) {
      return true;
    }
    if (nextState.fetchStatus !== fetchStatus) {
      return true;
    }
    if (nextState.rows !== rows) {
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    const { fetchStatus, rows } = this.state;
    if (fetchStatus === 'complete' && rows) {
      this.getRowsField();
    }
  }

  componentWillUnmount() {
    this._isMount = false;
    if (this.fetchWatch) this.fetchWatch();
  }

  getRowsField = async (query = '') => {
    const indices: number[] = [];
    const { rows } = this.state;
    if (!rows) {
      this.setState({ elements: [] })
      return;
    }
    if (!document)
      this.getRowsField();
    if (!query) {
      const cols = document.querySelectorAll(`.kbn-table thead th`);
      if (!(cols || []).length) {
        setTimeout(this.getRowsField, 100);
      }
      cols.forEach((col, idx) => {
        if (['rule.mitre.id', 'rule.id'].includes(col.textContent || '')) {
          indices.push(idx + 1);
        }
      });
      indices.forEach((position, idx) => {
        query += `.kbn-table tbody tr td:nth-child(${position}) div`
        if (idx !== indices.length - 1) {
          query += ', ';
        }
      });
    }
    if (query) {
      var interval = setInterval(() => {
        const elements = document.querySelectorAll(query);
        if (!(elements || []).length) {
          clearInterval(interval);
          setTimeout(() => { this.getRowsField(query) }, 100);
        }
        let isClearable = true;
        elements.forEach((element, idx) => {
          const text = element.textContent;
          if (idx % 2) {
            element.childNodes.forEach(child => {
              if (child.nodeName === 'SPAN') {
                const link = document.createElement('a')
                link.setAttribute('href', `#/manager/rules?tab=rules&redirectRule=${text}`)
                link.setAttribute('target', '_blank')
                link.setAttribute('style', 'minWidth: 55, display: "block"');
                link.textContent = text;
                child.replaceWith(link);
                isClearable = false;
              }
            })
          } else {
            element.childNodes.forEach(child => {
              if (child.nodeName === 'SPAN') {
                const formattedText = text.replace(/\s/g, ''); // remove spaces
                const splitText = formattedText.split(",");
                const divLink = document.createElement('div');
                divLink.setAttribute('style', 'min-width: 120px;');
                splitText.forEach((item,idx) => {
                  const link = document.createElement('a')
                  link.onclick = () => this.showFlyout(item);
                  if(idx !== splitText.length-1)
                    link.textContent = item + ", ";
                  else
                    link.textContent = item;
                  divLink.appendChild(link)
                })
                child.replaceWith(divLink);
                isClearable = false;
              }
            })
          }
        })
        if (isClearable)
          clearInterval(interval);
      }, 500);
    }
  }

  showFlyout(techniqueId) {
    this.setState({ isFlyoutVisible: true, currentTechnique: techniqueId });
  }

  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentTechnique: false });
  }

  onChangeFlyout = (isFlyoutVisible: boolean) => {
    this.setState({ isFlyoutVisible });
}

  render() {
    return (
      this.state.isFlyoutVisible &&
      <EuiOverlayMask
        // @ts-ignore
        onClick={(e: Event) => { e.target.className === 'euiOverlayMask' && this.closeFlyout() }} >
        
        
        <FlyoutTechnique
            onChangeFlyout={this.onChangeFlyout}
            currentTechnique={this.state.currentTechnique} />
        
      </EuiOverlayMask>
    )
  }
}
