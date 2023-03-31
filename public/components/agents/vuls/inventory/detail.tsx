/*
 * Wazuh app - Agent vulnerabilities table component
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
  EuiListGroup,
  EuiBadge,
  EuiText,
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
import { FilterManager } from '../../../../../../../src/plugins/data/public/';
import { beautifyDate } from './lib/';
export class Details extends Component {
  props!: {
    currentItem: {
      cve: string;
      name: string;
      version: string;
      architecture: string;
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
        field: 'title',
        name: 'Title',
        icon: 'home',
        link: false,
      },
      {
        field: 'name',
        name: 'Name',
        icon: 'dot',
        link: true,
      },
      {
        field: 'cve',
        name: 'CVE',
        icon: 'securitySignal',
        link: true,
      },
      {
        field: 'version',
        name: 'Version',
        icon: 'package',
        link: true,
      },
      {
        field: 'architecture',
        name: 'Architecture',
        icon: 'node',
        link: true,
      },
      {
        field: 'condition',
        name: 'Condition',
        icon: 'crosshairs',
        link: false,
      },
      {
        field: 'last_full_scan',
        name: 'Last full scan',
        icon: 'clock',
        link: false,
        transformValue: beautifyDate
      },
      {
        field: 'last_partial_scan',
        name: 'Last partial scan',
        icon: 'clock',
        link: false,
        transformValue: beautifyDate
      },
      {
        field: 'published',
        name: 'Published',
        icon: 'clock',
        link: false,
        transformValue: beautifyDate
      },
      {
        field: 'updated',
        name: 'Updated',
        icon: 'clock',
        link: false,
        transformValue: beautifyDate
      },
      {
        field: 'external_references',
        name: 'References',
        icon: 'link',
        link: false,
        transformValue: this.renderExternalReferences
      },
    ];
  }



  viewInEvents = (ev) => {
    const { cve } = this.props.currentItem;
    if (this.props.view === 'extern') {
      AppNavigate.navigateToModule(ev, 'overview', {
        tab: 'vuls',
        tabView: 'events',
        filters: { 'data.vulnerability.cve': cve },
      });
    } else {
      AppNavigate.navigateToModule(
        ev,
        'overview',
        { tab: 'vuls', tabView: 'events', filters: { 'data.vulnerability.cve': cve } },
        () => this.openEventCurrentWindow()
      );
    }
  };

  openEventCurrentWindow() {
    const { cve } = this.props.currentItem;
    const filters = [
      {
        ...buildPhraseFilter(
          { name: 'data.vulnerability.cve', type: 'text' },
          cve,
          this.indexPattern
        ),
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
      filterManager.addFilters([filters]);
      const scope = await ModulesHelper.getDiscoverScope();
      scope.updateQueryAndFetch && scope.updateQueryAndFetch({ query: null });
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
      newBadge.value = `${field}=${field === 'size' ? this.props.currentItem[field] : value}`;
    }
    !filters.some((item) => item.field === newBadge.field && item.value === newBadge.value) &&
      onFiltersChange([...filters, newBadge]);
    this.props.closeFlyout();
  }

  getDetails() {
    const { view } = this.props;
    const columns = this.details();
    const generalDetails = columns.map((item, idx) => {
      var value = this.props.currentItem[item.field] || '-';
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
                  <span className="detail-title">{item.name}</span>
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

  renderExternalReferences(references: string[]) {
    return references.length ? (
      <EuiAccordion
        id="modules_vulnerabilities_inventory_flyout_details_references"
        paddingSize="none"
        initialIsOpen={false}
        arrowDisplay="none"
        buttonContent={
          <EuiTitle size="xs">
            <EuiToolTip position="top" content="View external references">
              <p className="detail-value" style={{ margin: 0 }}>View external references <EuiIcon
                className="euiButtonIcon euiButtonIcon--primary"
                type="inspect"
                aria-label="show"
              /></p>
            </EuiToolTip>
          </EuiTitle>
        }>
        <EuiListGroup size="xs" flush={true} gutterSize="none" style={{ display: 'grid' }}
          listItems={references.map(link => ({ label: link, href: link, target: '_blank' }))
          }
        />
      </EuiAccordion>
    ) : "-";
  }

  updateTotalHits = (total) => {
    this.setState({ totalHits: total });
  };

  renderDetailsPermissions(value) {
    if (((this.props.agent || {}).os || {}).platform === 'windows' && value && value !== '-') {
      const components = value
        .split(', ')
        .map((userNameAndPermissionsFullString) => {
          const [_, username, userPermissionsString] = userNameAndPermissionsFullString.match(
            /(\S+) \(allowed\): (\S+)/
          );
          const permissions = userPermissionsString.split('|').sort();
          return { username, permissions };
        })
        .sort((a, b) => {
          if (a.username > b.username) {
            return 1;
          } else if (a.username < b.username) {
            return -1;
          } else {
            return 0;
          }
        })
        .map(({ username, permissions }) => {
          return (
            <EuiToolTip
              key={`permissions-windows-user-${username}`}
              content={permissions.join(', ')}
              title={`${username} permissions`}
            >
              <EuiBadge color="hollow" title={null} style={{ margin: '2px 2px' }}>
                {username}
              </EuiBadge>
            </EuiToolTip>
          );
        });
      return (
        <TruncateHorizontalComponents
          components={components}
          labelButtonHideComponents={(count) => `+${count} users`}
          buttonProps={{ size: 'xs' }}
          componentsWidthPercentage={0.85}
        />
      );
    }
    return value;
  }

  render() {
    const { type, implicitFilters, view, currentItem, agent } = this.props;
    const id = `${currentItem.name}-${currentItem.cve}-${currentItem.architecture}-${currentItem.version}`;
    const inspectButtonText = view === 'extern' ? 'Inspect in Dashboard' : 'Inspect in Events';
    return (
      <Fragment>
        <EuiAccordion
          id={id === undefined ? Math.random().toString() : `${id}_details`}
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
        <EuiSpacer />
        <EuiAccordion
          id={id === undefined ? Math.random().toString() : `${id}_events`}
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
                  { field: 'rule.description', label: 'Description' },
                  { field: 'rule.level', label: 'Level' },
                  { field: 'rule.id', label: 'Rule ID' },
                ]}
                initialAgentColumns={[
                  { field: 'icon' },
                  { field: 'timestamp' },
                  { field: 'rule.description', label: 'Description' },
                  { field: 'rule.level', label: 'Level' },
                  { field: 'rule.id', label: 'Rule ID' },
                  { field: 'data.vulnerability.status', label: 'Status', width: '20%' },
                ]}
                includeFilters="vulnerability"
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
