/*
 * Wazuh app - Integrity monitoring table component
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
  EuiAccordion,
  EuiFlexGrid,
  EuiFlexItem,
  EuiText,
  EuiFlexGroup,
  EuiTitle,
  EuiButtonEmpty,
  EuiToolTip,
  EuiSpacer,
  EuiStat
} from '@elastic/eui';
import { Discover } from '../../../common/modules/discover'

export class FileDetails extends Component {

  props!: {
    currentFile: {
      file: string
    },
    implicitFilters: Array<Object>,
    loadEventsWithFilters: Function
  }

  constructor(props) {
    super(props);

    this.state = {
    }
  }


  details() {
    return [
      {
        field: 'date',
        name: 'Last analysis',
        grow: 2
      },
      {
        field: 'mtime',
        name: 'Last modified',
        grow: 2
      },
      {
        field: 'uname',
        name: 'User',
      },
      {
        field: 'uid',
        name: 'User ID',
      },
      {
        field: 'gname',
        name: 'Group',
      },
      {
        field: 'gid',
        name: 'Group ID',
      },
      {
        field: 'perm',
        name: 'Permissions',
      },
      {
        field: 'size',
        name: 'Size',
      },
      {
        field: 'inode',
        name: 'Inode',
      },
      {
        field: 'md5',
        name: 'MD5',
      },
      {
        field: 'sha1',
        name: 'SHA1',
      },
      {
        field: 'sha256',
        name: 'SHA256',
      }
    ]
  }

  viewInEvents() {
    const filters = [{
      "meta": {
        "disabled": false,
        "key": "syscheck.path",
        "params": { "query": this.props.currentFile.file },
        "type": "phrase",
        "index": "wazuh-alerts-3.x-*"
      },
      "query": { "match_phrase": { "syscheck.path": this.props.currentFile.file } },
      "$state": { "store": "appState" }
    }];
    this.props.loadEventsWithFilters(filters);
  }

  getDetails() {
    const columns = this.details();
    const generalDetails = columns.map((item, idx) => {
      var value = this.props.currentFile[item.field] || '-';
      return (
        <EuiFlexItem key={idx}>
          <EuiStat
            title={
              <EuiText className="detail-value">
                {value}
              </EuiText>
            }
            description={item.name}
            textAlign="left"
            titleSize="xs"
          />
        </EuiFlexItem>
      )
    });

    return (
      <div>
        <EuiFlexGrid columns={3}> {generalDetails} </EuiFlexGrid>
      </div>);
  }

  render() {
    return (
      <Fragment>
        <EuiAccordion
          buttonContent={
            <EuiTitle size="s">
              <h3>Details</h3>
            </EuiTitle>
          }
          paddingSize="none"
          initialIsOpen={true}>
          <div className='details-row'>
            {this.getDetails()}
          </div>
        </EuiAccordion>
        <EuiSpacer size='m' />
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
              <h2>File events</h2>
            </EuiTitle>
          </EuiFlexItem>
          {this.props.showViewInEvents &&
            <EuiFlexItem grow={false} style={{ marginLeft: 0 }}>
              <EuiButtonEmpty onClick={() => this.viewInEvents()} className="view-in-events-btn">
                View in Events
            </EuiButtonEmpty>
            </EuiFlexItem>
          }
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <Discover implicitFilters={this.props.implicitFilters} initialFilters={[]} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    )
  }
}
