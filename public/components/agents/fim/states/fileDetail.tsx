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
  EuiFlexGroup,
  EuiTitle,
  EuiButtonEmpty,
  EuiIcon,
  EuiSpacer,
  EuiStat,
  EuiLink,
  EuiToolTip
} from '@elastic/eui';
import { Discover } from '../../../common/modules/discover'

export class FileDetails extends Component {

  props!: {
    currentFile: {
      file: string
    },
    implicitFilters: Array<Object>,
    loadEventsWithFilters: Function,
    [key:string]: any
  }
  userSvg = <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="euiIcon euiIcon--large euiIcon euiIcon--primary euiIcon-isLoaded detail-icon" focusable="false" role="img" aria-hidden="true"><path fill-rule="evenodd" d="M5.482 4.344a2 2 0 10-2.963 0c-.08.042-.156.087-.23.136-.457.305-.75.704-.933 1.073A3.457 3.457 0 001 6.978V9a1 1 0 001 1h2.5a3.69 3.69 0 01.684-.962L5.171 9H2V7s0-2 2-2c1.007 0 1.507.507 1.755 1.01.225-.254.493-.47.793-.636a2.717 2.717 0 00-1.066-1.03zM4 4a1 1 0 100-2 1 1 0 000 2zm10 6h-2.5a3.684 3.684 0 00-.684-.962L10.829 9H14V7s0-2-2-2c-1.007 0-1.507.507-1.755 1.01a3.012 3.012 0 00-.793-.636 2.716 2.716 0 011.066-1.03 2 2 0 112.963 0c.08.042.156.087.23.136.457.305.75.704.933 1.073A3.453 3.453 0 0115 6.944V9a1 1 0 01-1 1zm-2-6a1 1 0 100-2 1 1 0 000 2z"></path><path fill-rule="evenodd" d="M10 8c0 .517-.196.989-.518 1.344a2.755 2.755 0 011.163 1.21A3.453 3.453 0 0111 11.977V14a1 1 0 01-1 1H6a1 1 0 01-1-1v-2.022a2.005 2.005 0 01.006-.135 3.456 3.456 0 01.35-1.29 2.755 2.755 0 011.162-1.21A2 2 0 1110 8zm-4 4v2h4v-2s0-2-2-2-2 2-2 2zm3-4a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>

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
        grow: 2,
        icon: 'clock',
      },
      {
        field: 'mtime',
        name: 'Last modified',
        grow: 2,
        icon: 'clock',
      },
      {
        field: 'uname',
        name: 'User',
        icon: 'user',
        link: true,
      },
      {
        field: 'uid',
        name: 'User ID',
        icon: 'user',
        link: true,
      },
      {
        field: 'gname',
        name: 'Group',
        icon: 'usersRolesApp',
        onlyLinux: true,
        link: true,
      },
      {
        field: 'gid',
        name: 'Group ID',
        onlyLinux: true,
        icon: 'usersRolesApp',
        link: true,
      },
      {
        field: 'perm',
        name: 'Permissions',
        icon: 'lock',
      },
      {
        field: 'size',
        name: 'Size',
        icon: 'nested',
      },
      {
        field: 'inode',
        name: 'Inode',
        icon: 'link',
        onlyLinux: true,
      },
      {
        field: 'md5',
        name: 'MD5',
        checksum: true,
        icon: 'check',
      },
      {
        field: 'sha1',
        name: 'SHA1',
        checksum: true,
        icon: 'check',
      },
      {
        field: 'sha256',
        name: 'SHA256',
        checksum: true,
        icon: 'check',
      }
    ]
  }

  registryDetails() {
    return [
      {
        field: 'date',
        name: 'Last analysis',
        grow: 2,
        icon: 'clock'
      },
      {
        field: 'mtime',
        name: 'Last modified',
        grow: 2,
        icon: 'clock'
      },
      {
        field: 'sha1',
        name: 'SHA1',
        checksum: true,
        icon: 'check'
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
    const columns = this.props.type === 'file' ? this.details() : this.registryDetails();
    const generalDetails = columns.map((item, idx) => {
      var value = this.props.currentFile[item.field] || '-';
      var link = item.link || false;
      if (!item.onlyLinux || (item.onlyLinux && this.props.agent.agentPlatform !== 'windows')){
        let className = item.checksum ? "detail-value detail-value-checksum" : "detail-value";
        className += item.field === 'perm' ? " detail-value-perm" : "";
        return (
          <EuiFlexItem key={idx}>
            <EuiStat
              title={
                  !link 
                  ? <EuiToolTip position="top" anchorClassName="detail-tooltip" content={value} delay="long">
                      <span className={className}>{value}</span>
                    </EuiToolTip> 
                  : <EuiLink
                      className={className}
                      onClick={() => {
                        this.props.onFilterSelect(`${item.field}=${value}`);
                        this.props.closeFlyout();
                      }} >
                      {value}
                    </EuiLink>
              }
              description={
                <span>
                  {item.icon !== 'users' 
                    ? <EuiIcon size="l" type={item.icon} color='primary' className="detail-icon" />
                    : this.userSvg
                  }
                  <span className="detail-title">{item.name}</span>
                </span>
              }
              textAlign="left"
              titleSize="xs"
            />
          </EuiFlexItem>
        )
      }
    });

    return (
      <div>
        <EuiFlexGrid columns={3}> {generalDetails} </EuiFlexGrid>
      </div>);
  }

  render() {
    const { fileName, type, showViewInEvents, implicitFilters } = this.props;
    return (
      <Fragment>
        <EuiAccordion
          id={fileName}
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
              <h2>{type === 'file' ? 'File' : 'Registry'} events</h2>
            </EuiTitle>
          </EuiFlexItem>
          {showViewInEvents &&
            <EuiFlexItem grow={false} style={{ marginLeft: 0 }}>
              <EuiButtonEmpty onClick={() => this.viewInEvents()} className="view-in-events-btn">
                View in Events
            </EuiButtonEmpty>
            </EuiFlexItem>
          }
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <Discover implicitFilters={implicitFilters} initialFilters={[]} type={type} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    )
  }
}
