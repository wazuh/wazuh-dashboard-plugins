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

import React, { Component } from 'react';
import {
  EuiTableRowCell,
  EuiTableRow,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableBody,
  EuiCodeBlock,
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiTable,
  EuiToolTip,
  EuiFlexGroup,
  EuiLink,
  EuiTab
} from '@elastic/eui';
import './discover.less';
import { EuiFlexItem } from '@elastic/eui';
import { ApiRequest } from '../../../../react-services/api-request';



export class RowDetails extends Component {
  state: {
    selectedTabId: string,
    ruleData: {
      items: Array<any>,
      totalItems: Number
    }
  };

  complianceEquivalences: Object

  props!: {
    addFilter: Function,
    item: {
      rule: {
        id: Number,
      },
      syscheck: Object
    }
  }

  constructor(props) {
    super(props);

    this.state = {
      selectedTabId: "table",
      ruleData: {
        items: [],
        totalItems: 0
      }
    }

    this.complianceEquivalences = {
      pci: 'PCI DSS',
      gdpr: 'GDPR',
      gpg13: 'GPG 13',
      hipaa: 'HIPAA',
      'nist-800-53': 'NIST-800-53'
    }

  }

  propertiesToArray(obj) {
    const isObject = val =>
      typeof val === 'object' && !Array.isArray(val);

    const addDelimiter = (a, b) =>
      a ? `${a}.${b}` : b;

    const paths = (obj = {}, head = '') => {
      return Object.entries(obj)
        .reduce((product, [key, value]) => {
          let fullPath = addDelimiter(head, key)
          return isObject(value) ?
            product.concat(paths(value, fullPath))
            : product.concat(fullPath)
        }, []);
    }

    return paths(obj);
  }

  async componentDidMount() {
    const rulesDataResponse = await ApiRequest.request('GET', `/rules`, { q: `id=${this.props.item.rule.id}` });
    const ruleData = (rulesDataResponse.data || {}).data || {};
    this.setState({ ruleData })
  }

  getChildFromPath(object, path) {
    const pathArray = path.split('.');
    var child = object[pathArray[0]];
    for (var i = 1; i < pathArray.length; i++) {
      child = child[pathArray[i]];
    }
    return child;
  }

  renderRows(syscheckPaths) {
    const columns = [
      {
        id: 'actions',
      },
      {
        id: 'key',
      },
      {
        id: 'value',
      }
    ];

    const rows = syscheckPaths.map((item, idx) => {
      const cells = columns.map((currentColumn, idx) => {
        let child = (<span></span>);
        const key = "syscheck." + item;
        if (currentColumn.id === 'actions') {
          child = (<span></span>);
        }
        if (currentColumn.id === 'key') {
          child = <span>{key}</span>;
        }
        if (currentColumn.id === 'value') {
          const value = this.getChildFromPath(this.props.item.syscheck, item);
          const filter = {};
          filter[key] = value;
          child = (
          <EuiToolTip position="top" content={`Filter by ${key} : ${value}`}>
            <EuiLink onClick={async () => this.props.addFilter(filter)}>
              &nbsp;{value}
            </EuiLink>
          </EuiToolTip>
          )
        }
        return (
          <EuiTableRowCell
            key={idx}
            textOnly={true}
            style={{ borderBottom: "none", borderTop: "none", lineHeight: 1.15 }}>
            {child}
          </EuiTableRowCell>
        );
      });

      return (
        <EuiTableRow
          key={idx}>
          {cells}
        </EuiTableRow>
      );
    });
    if (!rows.length) {
      return (<div style={{width: 200}}>No syscheck data was found.</div>)
    }
    return rows;
  }

  renderHeaderCells() {
    const header: Array<JSX.Element> = [];

    header.push(
      <EuiTableHeaderCell
        key="actions"
        width="40">
      </EuiTableHeaderCell>
    )
    header.push(
      <EuiTableHeaderCell
        key="key"
        width="220">
      </EuiTableHeaderCell>
    )
    header.push(
      <EuiTableHeaderCell
        key="value">
      </EuiTableHeaderCell>
    )

    return header;
  }

  getTable() {
    const syscheckPaths = this.propertiesToArray(this.props.item.syscheck);
    return (
      <div style={{ height: 400, overflow: 'auto' }}>
        <EuiTable>
          <EuiTableHeader style={{ visibility: "collapse" }}>{this.renderHeaderCells()}</EuiTableHeader>
          <EuiTableBody>{this.renderRows(syscheckPaths)}</EuiTableBody>
        </EuiTable>

      </div>)
  }

  getJSON() {
    const str = JSON.stringify(this.props.item, null, 2);
    return (
      <div>
        <EuiCodeBlock
          language="json"
          fontSize="s"
          paddingSize="m"
          color="dark"
          overflowHeight={400}
          isCopyable>
          {str}
        </EuiCodeBlock>

      </div>
    )
  }

  /**
   * Render the basic rule information in a list
   * @param {Number} id
   * @param {Number} level
   * @param {String} file
   * @param {String} path
   */
  renderInfo(id, level, file, path) {
    return (
      <ul>
        <li key="id"><b>ID:</b>&nbsp;
          <EuiToolTip position="top" content={`Filter by this rule id: ${id}`}>
            <EuiLink onClick={async () => this.props.addFilter({"rule.id": id})}>
              &nbsp;{id}
            </EuiLink>
          </EuiToolTip>
        </li>
        <EuiSpacer size="s" />
        <li key="level"><b>Level:</b>
          <EuiToolTip position="top" content={`Filter by this level: ${level}`}>
            <EuiLink onClick={async () => this.props.addFilter({"rule.level":level})}>
              &nbsp;{level}
            </EuiLink>
          </EuiToolTip>
        </li>

        <EuiSpacer size="s" />
        <li key="file"><b>File:</b>
              &nbsp;{file}
        </li>
        <EuiSpacer size="s" />
        <li key="path"><b>Path:</b>
              &nbsp;{path}
        </li>

        <EuiSpacer size="s" />
      </ul>
    )
  }


  /**
  * Render a list with the details
* @param {Array} details
   */
  renderDetails(details) {
    const detailsToRender:Array<JSX.Element> = [];

    Object.keys(details).forEach((key, inx) => {
      detailsToRender.push(
        <li key={key}><b>{key}:</b>&nbsp;{details[key] === '' ? 'true' : details[key]}</li>
      );
    });
    return (
      <ul style={{ lineHeight: 'initial' }}>
        {detailsToRender}
      </ul>
    )
  }

  /**
  * Render the groups
* @param {Array} groups
   */
  renderGroups(groups) {
    const listGroups:Array<JSX.Element> = [];
    groups.forEach((group, index) => {
      listGroups.push(
        <span key={group}>
          <EuiLink onClick={async () => this.props.addFilter({ "rule.groups": group})}>
            <EuiToolTip position="top" content={`Filter by this group: ${group}`}>
              <span>
                {group}
              </span>
            </EuiToolTip>
          </EuiLink>
          {(index < groups.length - 1) && ', '}
        </span>
      );
    });
    return (
      <ul>
        <li>
          {listGroups}
        </li>
      </ul>
    )
  }
  /**
   * Build an object with the compliance info about a rule
   * @param {Object} ruleInfo
   */
  buildCompliance(ruleInfo) {
    const compliance = {};
    const complianceKeys = ['gdpr', 'gpg13', 'hipaa', 'nist-800-53', 'pci'];
    Object.keys(ruleInfo).forEach(key => {
      if (complianceKeys.includes(key) && ruleInfo[key].length) compliance[key] = ruleInfo[key]
    });
    return compliance || {};
  }

  getComplianceKey(key){
    if( key === 'pci'){
      return 'rule.pci_dss'
    }
    if( key === 'gdpr'){
      return 'rule.gdpr'
    }
    if( key === 'gpg13'){
      return 'rule.gpg13'
    }
    if( key === 'hipaa'){
      return 'rule.hipaa'
    }
    if( key === 'nist-800-53'){
      return 'rule.nist_800_53'
    }

    return "";
  }

  renderCompliance = (compliance) => {
    const listCompliance:Array<JSX.Element> = [];
    const keys = Object.keys(compliance);
    for (let i in Object.keys(keys)) {
      const key = keys[i];

      const values = compliance[key].map((element, index) => {
        const filters = {};
        filters[key] = element;
        const filter = {};
        if(this.getComplianceKey(key)){
          filter[this.getComplianceKey(key)] = element;
        }
        return (
          <span key={element}>
            <EuiLink onClick={async () => this.props.addFilter(filter)}>
              <EuiToolTip position="top" content="Filter by this compliance">
                <span>{element}</span>
              </EuiToolTip>
            </EuiLink>
            {(index < compliance[key].length - 1) && ', '}
          </span>
        );
      });

      listCompliance.push(
        <li key={key}>
          <b>{this.complianceEquivalences[key]}</b>
          <p>{values}</p>
          <EuiSpacer size='s' />
        </li>
      )

    }
    return (
      <ul>
        {listCompliance}
      </ul>
    )
  }


  getRule() {
    const item = this.state.ruleData.items[0];
    const { id, level, file, path, groups, details } = item;
    const compliance = this.buildCompliance(item);
 
    return (
      <EuiFlexGroup style={{ height: 412, marginTop: 0 }}>
        {/* General info */}
        <EuiFlexItem>
          <EuiPanel paddingSize="m">
            <EuiTitle size={'s'}>
              <h3>Information</h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            {this.renderInfo(id, level, file, path)}
            {/* Groups */}
            <EuiSpacer size={'m'} />
            <EuiTitle size={'s'}>
              <h3>Groups</h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            {this.renderGroups(groups)}
          </EuiPanel>
        </EuiFlexItem>
        {/* Details */}
        <EuiFlexItem>
          <EuiPanel paddingSize="m">
            <EuiTitle size={'s'}>
              <h3>Details</h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            {this.renderDetails(details)}
          </EuiPanel>
        </EuiFlexItem>
        { Object.keys(compliance).length > 0 && ( 
            <EuiFlexItem>
              <EuiPanel paddingSize="m">
                <EuiTitle size={'s'}>
                  <h3>Compliance</h3>
                </EuiTitle>
                <EuiSpacer size="s" />
                {this.renderCompliance(compliance)}
              </EuiPanel>
            </EuiFlexItem>
          ) }
      </EuiFlexGroup>
    )
  }


  onSelectedTabChanged = id => {
    this.setState({
      selectedTabId: id,
    });
  };

  getTabs() {
    const tabs = [
      {
        id: 'table',
        name: 'Table',
        disabled: false,
      },
      {
        id: 'json',
        name: 'JSON',
        disabled: false,
      },
      {
        id: 'rule',
        name: 'Rule',
        disabled: false,
      }
    ];

    return tabs.map((tab, index) => (
      <EuiTab
        onClick={() => this.onSelectedTabChanged(tab.id)}
        isSelected={tab.id === this.state.selectedTabId}
        disabled={tab.disabled}
        key={index}>
        {tab.name}
      </EuiTab>
    ));
  }

  render() {

    return (
      <div>

        {this.getTabs()}
        <EuiFlexGroup>
          <EuiFlexItem>
            {this.state.selectedTabId === 'table' && (
              this.getTable()
            )}
            {this.state.selectedTabId === 'json' && (
              this.getJSON()
            )}
            {this.state.selectedTabId === 'rule' && this.state.ruleData.totalItems === 1 && (
              this.getRule()
            ) || this.state.selectedTabId === 'rule' &&
              (
                <span>There was an error loading rule ID: {this.props.item.rule.id}</span>
              )}
          </EuiFlexItem>

        </EuiFlexGroup>

      </div>
    );
  }
}
