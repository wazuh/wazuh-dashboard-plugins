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
  EuiCodeBlock,
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiIcon,
  EuiToolTip,
  EuiFlexGroup,
  EuiLink,
  EuiTabs,
  EuiTab,
  EuiTable,
  EuiTableBody,
  EuiTableRow,
  EuiTableRowCell,
  EuiButtonIcon,
  EuiFlexGrid,
  EuiBadge
} from '@elastic/eui';
import './discover.less';
import { EuiFlexItem } from '@elastic/eui';
import { ApiRequest } from '../../../../react-services/api-request';

const capitalize = str => str[0].toUpperCase() + str.slice(1);

export class RowDetails extends Component {
  _isMount = false;
  state: {
    selectedTabId: string,
    ruleData: {
      items: Array<any>,
      totalItems: Number
    },
    hover: string
  };

  complianceEquivalences: Object

  props!: {
    addFilter: Function,
    addFilterOut: Function,
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
        totalItems: 0,
      },
      hover: ''
    }

    this.complianceEquivalences = {
      pci: 'PCI DSS',
      gdpr: 'GDPR',
      gpg13: 'GPG 13',
      hipaa: 'HIPAA',
      mitre: 'MITRE',
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
    this._isMount = true;
    const rulesDataResponse = await ApiRequest.request('GET', `/rules`, { q: `id=${this.props.item.rule.id}` });
    const ruleData = (rulesDataResponse.data || {}).data || {};
    if (this._isMount) {
      this.setState({ ruleData })
    }
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  getChildFromPath(object, path) {
    const pathArray = path.split('.');
    var child = object[pathArray[0]];
    for (var i = 1; i < pathArray.length; i++) {
      child = child[pathArray[i]];
    }

    if (!Array.isArray(child)) {
      child.toString();
    }
    return child;
  }

  getFilterLink = (key, value) => {
    const filter = {};
    filter[key] = value;
    return (
      <EuiToolTip position="top" content={`Filter by ${key}:${value}`}>
        <EuiLink onClick={async () => this.props.addFilter(filter)}>
          &nbsp;{value}
        </EuiLink>
      </EuiToolTip>)
  }



  renderRows() {
    const fieldsToShow = ['agent', 'cluster', 'manager', 'rule', 'decoder', 'syscheck'];
    var rows: any[] = [];

    for (var i = 0; i < fieldsToShow.length; i++) {
      if (this.props.item[fieldsToShow[i]]) {
        const itemPaths = this.propertiesToArray(this.props.item[fieldsToShow[i]]);
        const tmpRows = itemPaths.map((item, idx) => {
          const key = fieldsToShow[i] + "." + item; // = agent + . + id = agent.id
          const value = this.getChildFromPath(this.props.item[fieldsToShow[i]], item);
          const filter = {};
          filter[key] = value;
          const cells: any[] = [];
          const actionsCell = <EuiTableRowCell
            className={this.state.hover === key ? "hover-row" : " "}
            style={{ width: 80, borderTop: 0, borderBottom: 0 }}
            key={key + "0"}>
            {(this.state.hover === key &&
              <EuiFlexGroup style={{ height: 35 }}>
                <EuiFlexItem grow={false} style={{ marginRight: 0, marginTop: 8 }}>
                  <EuiToolTip position="top" content={`Filter for value`}>
                    <EuiButtonIcon
                      onClick={() => this.props.addFilter(filter)}
                      iconType="magnifyWithPlus"
                      aria-label="Filter"
                      iconSize="s"
                    />
                  </EuiToolTip>
                </EuiFlexItem>
                <EuiFlexItem grow={false} style={{ marginRight: 0, marginLeft: 0, marginTop: 8 }}>
                  <EuiToolTip position="top" content={`Filter out value`}>
                    <EuiButtonIcon
                      onClick={() => this.props.addFilterOut(filter)}
                      iconType="magnifyWithMinus"
                      aria-label="Filter"
                      iconSize="s"
                    />
                  </EuiToolTip>
                </EuiFlexItem>
                <EuiFlexItem grow={false} style={{ marginRight: 0, marginLeft: 0, marginTop: 8 }}>
                  <EuiToolTip position="top" content={`Toggle column`}>
                    <EuiButtonIcon
                      onClick={() => this.props.toggleColumn(key)}
                      iconType="tableOfContents"
                      aria-label="Filter"
                      iconSize="s"
                    />
                  </EuiToolTip>
                </EuiFlexItem>
              </EuiFlexGroup>)}
          </EuiTableRowCell>

          cells.push(actionsCell);

          const keyCell = <EuiTableRowCell
            className={this.state.hover === key ? "hover-row" : " "}
            style={{ width: "20%", borderTop: 0, borderBottom: 0 }}
            key={key + "1"}>
            {<div>{key}</div>}
          </EuiTableRowCell>

          cells.push(keyCell);

          const formattedValue = Array.isArray(value) ? value.join(', ') : value.toString();

          const valueCell = <EuiTableRowCell
            className={this.state.hover === key ? "hover-row" : " "}
            style={{ borderTop: 0, borderBottom: 0, padding: 0, margin: 0 }}
            key={key + "2"}>
            {<div>{formattedValue}</div>}
          </EuiTableRowCell>

          cells.push(valueCell);

          return (
            <EuiTableRow
              onMouseEnter={() => this.setState({ hover: key })}
              onMouseLeave={() => this.setState({ hover: "" })}
              key={key}>
              {cells}
            </EuiTableRow>
          );
        }); //map
        rows = [...rows, ...tmpRows]
      }//if
    } //for 


    return rows;
  }

  getTable() {
    return (
      <div>
        <div>
          <EuiTable style={{ marginTop: 0 }}>
            <EuiTableBody style={{ marginTop: 0 }}>{this.renderRows()}</EuiTableBody>
          </EuiTable>
        </div>
      </div>
    )
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
          isCopyable>
          {str}
        </EuiCodeBlock>

      </div>
    )
  }


  /**
   * Build an object with the compliance info about a rule
   * @param {Object} ruleInfo
   */
  buildCompliance(ruleInfo) {
    const compliance = {};
    const complianceKeys = ['gdpr', 'gpg13', 'hipaa', 'nist-800-53', 'pci', 'mitre'];
    Object.keys(ruleInfo).forEach(key => {
      if (complianceKeys.includes(key) && ruleInfo[key].length) compliance[key] = ruleInfo[key]
    });
    return compliance || {};
  }

  getComplianceKey(key) {
    if (key === 'pci') {
      return 'rule.pci_dss'
    }
    if (key === 'gdpr') {
      return 'rule.gdpr'
    }
    if (key === 'gpg13') {
      return 'rule.gpg13'
    }
    if (key === 'hipaa') {
      return 'rule.hipaa'
    }
    if (key === 'nist-800-53') {
      return 'rule.nist_800_53'
    }
    if (key === 'mitre') {
      return 'rule.mitre.id'
    }

    return "";
  }

  getRule() {
    const item = this.state.ruleData.items[0];
    const { id, level, file, path, groups, details } = item;
    const compliance = this.buildCompliance(item);
    const styleTitle = { fontSize: "14px", fontWeight: 500 };
    const styleValue = { fontSize: "14px", fontWeight: 300 };
    return (
      <div className="rule_reset_display_anchor">
        <EuiSpacer size='s' />
        <EuiFlexGroup justifyContent='spaceAround'>
          <EuiFlexItem style={{ marginBottom: '0' }}>
            <EuiTitle size='s' style={{ fontWeight: 400 }}><h3>Information</h3></EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ fontSize: 14, marginBottom: '0' }}>
            <a href={`#/manager/rules?tab=rules&redirectRule=${id}`} target="_blank" style={{ paddingTop: 5 }}>
              <EuiIcon type="popout" color='primary' />&nbsp;
                View in Rules
              </a>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGrid columns={3}>
          <EuiFlexItem>
            <div style={styleTitle}>ID</div>
            <div>
              <EuiToolTip position="top" content={`Filter by this rule id: ${id}`}>
                <EuiLink style={{ display: 'inline' }} onClick={async () => this.props.addFilter({ "rule.id": id })}>
                  <span style={styleValue}>{id}</span>
                </EuiLink>
              </EuiToolTip>
            </div>
          </EuiFlexItem>
          <EuiFlexItem >
            <div style={styleTitle}>Level</div>
            <div>
              <EuiToolTip position="top" content={`Filter by this level: ${level}`}>
                <EuiLink onClick={async () => this.props.addFilter({ "rule.level": level })}>
                  <span style={styleValue}>{level}</span>
                </EuiLink>
              </EuiToolTip>
            </div>
          </EuiFlexItem>
          <EuiFlexItem>
            <div style={styleTitle}>File</div>
            <div style={styleValue}>{file}</div>
          </EuiFlexItem>
          <EuiFlexItem>
            <div style={styleTitle}>Path</div>
            <div style={styleValue}>{path}</div>
          </EuiFlexItem>
          <EuiFlexItem>
            <div style={styleTitle}>Groups</div>
            <div>
              {groups.map(group => (
                <EuiToolTip key={`rule-group-${group}`} position="top" content={`Filter by this group: ${group}`}>
                  <EuiLink onClick={async () => this.props.addFilter({ "rule.groups": group })}>
                    <span style={styleValue}>{group}</span>
                  </EuiLink>
                </EuiToolTip>
              )).reduce((prev, cur) => [prev, ', ', cur])}
            </div>
          </EuiFlexItem>

        </EuiFlexGrid>
        <EuiSpacer size='m' />
        <EuiTitle size='s' style={{ fontWeight: 400 }}><h3>Details</h3></EuiTitle>
        <EuiFlexGrid columns={3}>
          {Object.keys(details).map(detail => (
            <EuiFlexItem key={`rule-detail-${detail}`}>
              <div style={styleTitle}>{capitalize(detail)}</div>
              <div style={styleValue}>{details[detail]}</div>
            </EuiFlexItem>
          ))}
        </EuiFlexGrid>
        <EuiSpacer size='m' />
        <EuiTitle size='s' style={{ fontWeight: 400 }}><h3>Compliance</h3></EuiTitle>
        <EuiFlexGrid columns={3}>
          {Object.keys(compliance).sort().map(complianceCategory => {
            return (
              <EuiFlexItem key={`rule-compliance-${complianceCategory}`}>
                <div style={styleTitle}>{this.complianceEquivalences[complianceCategory]}</div>
                <div>
                  {compliance[complianceCategory].map(comp => {
                    const filter = {
                      [this.getComplianceKey(complianceCategory)]: comp
                    };
                    return (
                      <EuiToolTip position="top" content={`Filter by this compliance: ${this.complianceEquivalences[complianceCategory]} ${comp}`}>
                        <EuiBadge
                          color="hollow"
                          onClick={() => this.props.addFilter(filter)}
                          onClickAriaLabel={comp}
                          title={null}
                        >
                          {comp}
                        </EuiBadge>
                      </EuiToolTip>
                    )
                  }).reduce((prev, cur) => [prev, ' ', cur])}
                </div>
              </EuiFlexItem>
            )
          })}
        </EuiFlexGrid>
        <EuiSpacer size='s' />
      </div>
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
    return (
      <EuiTabs>
        {tabs.map((tab, index) => (
          <EuiTab
            onClick={() => this.onSelectedTabChanged(tab.id)}
            isSelected={tab.id === this.state.selectedTabId}
            disabled={tab.disabled}
            key={index}>
            {tab.name}
          </EuiTab>
        ))}
      </EuiTabs>
    )
  }

  render() {
    return (
      <div>
        {this.getTabs()}
        <EuiFlexGroup>
          <EuiFlexItem style={{ padding: 16 }}>
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
