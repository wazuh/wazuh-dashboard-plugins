/*
 * Wazuh app - Integrity monitoring table component
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
  EuiButtonIcon,
  EuiIcon,
  EuiSpacer,
  EuiStat,
  EuiToolTip,
  EuiBadge,
  EuiCodeBlock,
} from '@elastic/eui';
import { Discover } from '../../../common/modules/discover';
import { ModulesHelper } from '../../../common/modules/modules-helper';
import { ICustomBadges } from '../../../wz-search-bar/components';
import { buildPhraseFilter, IIndexPattern } from '../../../../../../../src/plugins/data/common';
import { getIndexPattern } from '../../../overview/mitre/lib';
import moment from 'moment-timezone';
import { AppNavigate } from '../../../../react-services/app-navigate';
import { TruncateHorizontalComponents } from '../../../common/util';
import { getDataPlugin, getUiSettings } from '../../../../kibana-services';
import { RegistryValues } from './registryValues';
import { formatUIDate } from '../../../../react-services/time-service';
import { FilterManager } from '../../../../../../../src/plugins/data/public/';

export class FileDetails extends Component {
  props!: {
    currentFile: {
      file: string;
      type: string;
    };
    implicitFilters: Array<Object>;
    loadEventsWithFilters: Function;
    [key: string]: any;
  };
  userSvg = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      className="euiIcon euiIcon--large euiIcon euiIcon--primary euiIcon-isLoaded detail-icon"
      focusable="false"
      role="img"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M5.482 4.344a2 2 0 10-2.963 0c-.08.042-.156.087-.23.136-.457.305-.75.704-.933 1.073A3.457 3.457 0 001 6.978V9a1 1 0 001 1h2.5a3.69 3.69 0 01.684-.962L5.171 9H2V7s0-2 2-2c1.007 0 1.507.507 1.755 1.01.225-.254.493-.47.793-.636a2.717 2.717 0 00-1.066-1.03zM4 4a1 1 0 100-2 1 1 0 000 2zm10 6h-2.5a3.684 3.684 0 00-.684-.962L10.829 9H14V7s0-2-2-2c-1.007 0-1.507.507-1.755 1.01a3.012 3.012 0 00-.793-.636 2.716 2.716 0 011.066-1.03 2 2 0 112.963 0c.08.042.156.087.23.136.457.305.75.704.933 1.073A3.453 3.453 0 0115 6.944V9a1 1 0 01-1 1zm-2-6a1 1 0 100-2 1 1 0 000 2z"
      ></path>
      <path
        fill-rule="evenodd"
        d="M10 8c0 .517-.196.989-.518 1.344a2.755 2.755 0 011.163 1.21A3.453 3.453 0 0111 11.977V14a1 1 0 01-1 1H6a1 1 0 01-1-1v-2.022a2.005 2.005 0 01.006-.135 3.456 3.456 0 01.35-1.29 2.755 2.755 0 011.162-1.21A2 2 0 1110 8zm-4 4v2h4v-2s0-2-2-2-2 2-2 2zm3-4a1 1 0 11-2 0 1 1 0 012 0z"
      ></path>
    </svg>
  );
  indexPattern!: IIndexPattern;
  discoverFilterManager: FilterManager;

  constructor(props) {
    super(props);

    this.state = {
      hoverAddFilter: '',
      totalHits: 0,
    };
    this.viewInEvents.bind(this);

    this.discoverFilterManager = new FilterManager(getUiSettings());
  }

  componentDidMount() {
    getIndexPattern().then((idxPtn) => (this.indexPattern = idxPtn));
  }

  details() {
    return [
      {
        field: 'date',
        name: 'Last analysis',
        grow: 2,
        icon: 'clock',
        link: true,
        transformValue: formatUIDate,
      },
      {
        field: 'mtime',
        name: 'Last modified',
        grow: 2,
        icon: 'clock',
        link: true,
        transformValue: formatUIDate,
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
        field: 'size',
        name: 'Size',
        icon: 'nested',
        link: true,
        transformValue: (value) => this.renderFileDetailsSize(value),
      },
      {
        field: 'inode',
        name: 'Inode',
        icon: 'link',
        onlyLinux: true,
        link: true,
      },
      {
        field: 'md5',
        name: 'MD5',
        checksum: true,
        icon: 'check',
        link: true,
      },
      {
        field: 'sha1',
        name: 'SHA1',
        checksum: true,
        icon: 'check',
        link: true,
      },
      {
        field: 'sha256',
        name: 'SHA256',
        checksum: true,
        icon: 'check',
        link: true,
      },
      {
        field: 'perm',
        name: 'Permissions',
        icon: 'lock',
        link: false,
        transformValue: (value) => this.renderFileDetailsPermissions(value),
      },
    ];
  }

  registryDetails() {
    return [
      {
        field: 'date',
        name: 'Last analysis',
        grow: 2,
        icon: 'clock',
        transformValue: formatUIDate,
      },
      {
        field: 'mtime',
        name: 'Last modified',
        grow: 2,
        icon: 'clock',
        transformValue: formatUIDate,
      },
    ];
  }

  viewInEvents = (ev) => {
    const { file } = this.props.currentFile;
    if (this.props.view === 'extern') {
      AppNavigate.navigateToModule(ev, 'overview', {
        tab: 'fim',
        tabView: 'events',
        filters: { 'syscheck.path': file },
      });
    } else {
      AppNavigate.navigateToModule(
        ev,
        'overview',
        { tab: 'fim', tabView: 'events', filters: { 'syscheck.path': file } },
        () => this.openEventCurrentWindow()
      );
    }
  };

  openEventCurrentWindow() {
    const { file } = this.props.currentFile;
    const filters = [
      {
        ...buildPhraseFilter({ name: 'syscheck.path', type: 'text' }, file, this.indexPattern),
        $state: { store: 'appState' },
      },
    ];

    this.props.onSelectedTabChanged('events');
    this.checkFilterManager(filters);
  }

  async checkFilterManager(filters) {
    const { filterManager } = getDataPlugin().query;
    const _filters = filterManager.getFilters();
    if (_filters && _filters.length) {
      const syscheckPathFilters = _filters.filter((x) => {
        return x.meta.key === 'syscheck.path';
      });
      syscheckPathFilters.map((x) => {
        filterManager.removeFilter(x);
      });
      filterManager.addFilters([filters]);
      const scope = await ModulesHelper.getDiscoverScope();
      scope.updateQueryAndFetch({ query: null });
    } else {
      setTimeout(() => {
        this.checkFilterManager(filters);
      }, 200);
    }
  }

  addFilter(field, value) {
    const { filters, onFiltersChange } = this.props;
    const newBadge: ICustomBadges = { field: 'q', value: '' };
    if (field === 'date' || field === 'mtime') {
      let value_max = moment(value).add(1, 'day');
      newBadge.value = `${field}>${moment(value).format(
        'YYYY-MM-DD'
      )} AND ${field}<${value_max.format('YYYY-MM-DD')}`;
    } else {
      newBadge.value = `${field}=${field === 'size' ? this.props.currentFile[field] : value}`;
    }
    !filters.some((item) => item.field === newBadge.field && item.value === newBadge.value) &&
      onFiltersChange([...filters, newBadge]);
    this.props.closeFlyout();
  }

  getDetails() {
    const { view } = this.props;
    const columns =
      this.props.type === 'registry_key' || this.props.currentFile.type === 'registry_key'
        ? this.registryDetails()
        : this.details();
    const generalDetails = columns.map((item, idx) => {
      var value = this.props.currentFile[item.field] || '-';
      if (item.transformValue) {
        value = item.transformValue(value, this.props);
      }
      var link = (item.link && !['events', 'extern'].includes(view)) || false;
      const agentPlatform = ((this.props.agent || {}).os || {}).platform;
      if (!item.onlyLinux || (item.onlyLinux && this.props.agent && agentPlatform !== 'windows')) {
        let className = item.checksum ? 'detail-value detail-value-checksum' : 'detail-value';
        className += item.field === 'perm' ? ' detail-value-perm' : '';
        className += ' wz-width-100';
        return (
          <EuiFlexItem key={idx}>
            <EuiStat
              title={
                !link ? (
                  <span className={className}>{value}</span>
                ) : (
                  <span
                    className={className}
                    onMouseEnter={() => {
                      this.setState({ hoverAddFilter: item.field });
                    }}
                    onMouseLeave={() => {
                      this.setState({ hoverAddFilter: '' });
                    }}
                  >
                    {value}
                    {this.state.hoverAddFilter === item.field && (
                      <EuiToolTip
                        position="top"
                        anchorClassName="detail-tooltip"
                        content={`Filter by ${item.field} is ${value} in inventory`}
                      >
                        <EuiButtonIcon
                          onClick={() => {
                            this.addFilter(item.field, value);
                          }}
                          iconType="magnifyWithPlus"
                          aria-label="Next"
                          iconSize="s"
                          className="buttonAddFilter"
                        />
                      </EuiToolTip>
                    )}
                  </span>
                )
              }
              description={
                <span>
                  {item.icon !== 'users' ? (
                    <EuiIcon size="l" type={item.icon} color="primary" className="detail-icon" />
                  ) : (
                    this.userSvg
                  )}
                  {item.name === 'Permissions' &&  agentPlatform === 'windows' ? '' : <span className="detail-title">{item.name}</span> }
                </span>
              }
              textAlign="left"
              titleSize="xs"
            />
          </EuiFlexItem>
        );
      }
    });
    return (
      <div>
        <EuiFlexGrid columns={3}> {generalDetails} </EuiFlexGrid>
      </div>
    );
  }

  updateTotalHits = (total) => {
    this.setState({ totalHits: total });
  };

  renderFileDetailsPermissions(value) {
    if (((this.props.agent || {}).os || {}).platform === 'windows' && value && value !== '-') {
      return (
        <EuiAccordion 
          id={Math.random().toString()}
          paddingSize="none" 
          initialIsOpen={false} 
          arrowDisplay="none"
          buttonContent={
          <EuiTitle size="s">
            <h3>
              Permissions
                  <span style={{ marginLeft: 16 }}>
                    <EuiToolTip position="top" content="Show">
                      <EuiIcon
                        className="euiButtonIcon euiButtonIcon--primary"
                        type="inspect"
                        aria-label="show"
                      />
                    </EuiToolTip>
                  </span>
            </h3>
          </EuiTitle>
        }>
          <EuiCodeBlock language="json" paddingSize="l">
            {JSON.stringify(value, null, 2)}
          </EuiCodeBlock>
        </EuiAccordion>
      );
    }
    return value;
  }

  renderFileDetailsSize(value) {
    if (isNaN(value)) {
      return 0;
    }
    const b = 2;
    if (0 === value) return '0 Bytes';
    const c = 0 > b ? 0 : b,
      d = Math.floor(Math.log(value) / Math.log(1024));
    return (
      parseFloat((value / Math.pow(1024, d)).toFixed(c)) +
      ' ' +
      ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][d]
    );
  }

  render() {
    const { fileName, type, implicitFilters, view, currentFile, agent, agentId } = this.props;
    const inspectButtonText = view === 'extern' ? 'Inspect in FIM' : 'Inspect in Events';
    return (
      <Fragment>
        <EuiAccordion
          id={fileName === undefined ? Math.random().toString() : `${fileName}_details`}
          buttonContent={
            <EuiTitle size="s">
              <h3>Details</h3>
            </EuiTitle>
          }
          paddingSize="none"
          initialIsOpen={true}
        >
          <div className="flyout-row details-row">{this.getDetails()}</div>
        </EuiAccordion>
        {(type === 'registry_key' || currentFile.type === 'registry_key') && (
          <>
            <EuiSpacer size="s" />
            <EuiAccordion
              id={fileName === undefined ? Math.random().toString() : `${fileName}_values`}
              buttonContent={
                <EuiTitle size="s">
                  <h3>Registry values</h3>
                </EuiTitle>
              }
              paddingSize="none"
              initialIsOpen={true}
            >
              <EuiFlexGroup className="flyout-row">
                <EuiFlexItem>
                  <RegistryValues 
                    currentFile={currentFile} 
                    agent={agent} 
                    agentId={agentId} 
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiAccordion>{' '}
          </>
        )}
        <EuiSpacer />
        <EuiAccordion
          id={fileName === undefined ? Math.random().toString() : `${fileName}_events`}
          className="events-accordion"
          extraAction={
            <div style={{ marginBottom: 5 }}>
              <strong>{this.state.totalHits || 0}</strong> hits
            </div>
          }
          buttonContent={
            <EuiTitle size="s">
              <h3>
                Recent events
                {view !== 'events' && (
                  <span style={{ marginLeft: 16 }}>
                    <EuiToolTip position="top" content={inspectButtonText}>
                      <EuiIcon
                        className="euiButtonIcon euiButtonIcon--primary"
                        onMouseDown={(ev) => this.viewInEvents(ev)}
                        type="popout"
                        aria-label={inspectButtonText}
                      />
                    </EuiToolTip>
                  </span>
                )}
              </h3>
            </EuiTitle>
          }
          paddingSize="none"
          initialIsOpen={true}
        >
          <EuiFlexGroup className="flyout-row">
            <EuiFlexItem>
              <Discover
                kbnSearchBar
                shareFilterManager={this.discoverFilterManager}
                initialColumns={[
                  { field: 'icon' },
                  { field: 'timestamp' },
                  { field: 'agent.id', label: 'Agent' },
                  { field: 'agent.name', label: 'Agent name' },
                  { field: 'syscheck.event', label: 'Action' },
                  { field: 'rule.description', label: 'Description' },
                  { field: 'rule.level', label: 'Level' },
                  { field: 'rule.id', label: 'Rule ID' },
                ]}
                initialAgentColumns={[
                  { field: 'icon' },
                  { field: 'timestamp' },
                  { field: 'syscheck.event', label: 'Action' },
                  { field: 'rule.description', label: 'Description' },
                  { field: 'rule.level', label: 'Level' },
                  { field: 'rule.id', label: 'Rule ID' },
                ]}
                includeFilters="syscheck"
                implicitFilters={implicitFilters}
                initialFilters={[]}
                type={type}
                updateTotalHits={(total) => this.updateTotalHits(total)}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiAccordion>
      </Fragment>
    );
  }
}
