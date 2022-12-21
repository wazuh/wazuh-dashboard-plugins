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

import React, { Component } from 'react';
import {
  EuiCodeBlock,
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
  EuiBadge,
  EuiAccordion,
} from '@elastic/eui';
import classNames from 'classnames';
import { DocViewTableRowBtnCollapse } from '../../../../kibana-integrations/discover/application/components/table/table_row_btn_collapse';
import { arrayContainsObjects, trimAngularSpan } from '../../../../kibana-integrations/discover/application/components/table/table_helper';
import './discover.scss';
import { EuiFlexItem } from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import WzTextWithTooltipTruncated from '../../../../components/common/wz-text-with-tooltip-if-truncated';

const capitalize = str => str[0].toUpperCase() + str.slice(1);

export class RowDetails extends Component {
  _isMount = false;
  state: {
    selectedTabId: string,
    ruleData: {
      items: Array<any>,
      totalItems: Number
    },
    hover: string,
    isCollapsed: boolean,
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
    rowDetailsFields?: string[]
  }

  constructor(props) {
    super(props);

    this.state = {
      selectedTabId: "table",
      ruleData: {
        items: [],
        totalItems: 0,
      },
      isCollapsed: true,
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
        .sort(([keyA], [keyB]) => {
          if (keyA > keyB) {
            return 1;
          } else if (keyA < keyB) {
            return -1;
          } else {
            return 0;
          };
        })
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
    const params = { q: `id=${this.props.item.rule.id}` }
    const rulesDataResponse = await WzRequest.apiReq('GET', `/rules`, { params });
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

  onToggleCollapse = () => {
    this.setState({ isCollapsed: !this.state.isCollapsed });
  }

  renderRows() {
    // By default show all available fields, otherwise show the fields specified in rowDetailsFields string array
    const fieldsToShow = this.props.rowDetailsFields?.length ?
      this.props.rowDetailsFields.sort() : Object.keys(this.props.item).sort();

    var rows: any[] = [];
    const isString = val => typeof val === 'string';
    for (var i = 0; i < fieldsToShow.length; i++) {
      const field = this.props.item[fieldsToShow[i]];
      if (field) {
        const itemPaths = isString(field) ? [fieldsToShow[i]] : this.propertiesToArray(field);
        const tmpRows = itemPaths.map((item) => {
          const key = isString(field) ? item : fieldsToShow[i] + "." + item; // = agent + . + id = agent.id
          const value = isString(field) ? field : this.getChildFromPath(this.props.item[fieldsToShow[i]], item);
          const hasFieldMapping = this.props?.indexPattern?.fields?.getByName(key)?.filterable;// if the field is mapped the filter can be added and removed
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
                  <EuiToolTip position="top" content={hasFieldMapping ? 'Filter for value' : 'Unindexed fields can not be searched'}>
                    <EuiButtonIcon
                      isDisabled={!hasFieldMapping}
                      onClick={() => this.props.addFilter(filter)}
                      iconType="magnifyWithPlus"
                      aria-label="Filter"
                      iconSize="s"
                    />
                  </EuiToolTip>
                </EuiFlexItem>
                <EuiFlexItem grow={false} style={{ marginRight: 0, marginLeft: 0, marginTop: 8 }}>
                  <EuiToolTip position="top" content={hasFieldMapping ? 'Filter out value' : 'Unindexed fields can not be searched'}>
                    <EuiButtonIcon
                      isDisabled={!hasFieldMapping}
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

          const formattedValue = Array.isArray(value) ? this.renderArrayValue(value) : value.toString();

          // If the field is an array of objects, show the collapse button to show the nested fields
          const showCollapseButton = Array.isArray(value) && arrayContainsObjects(value);

          const valueClassName = classNames({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            wzDocViewer__value: true,
            'truncate-by-height': showCollapseButton && this.state.isCollapsed,
            "hover-row": this.state.hover === key
          });

          const valueCell = <EuiTableRowCell
            className={valueClassName}
            style={{ borderTop: 0, borderBottom: 0, padding: 0, margin: 0 }}
            key={key + "2"}>
            { showCollapseButton && (
              <DocViewTableRowBtnCollapse onClick={this.onToggleCollapse} isCollapsed={this.state.isCollapsed} />
            )}
            <div
              data-test-subj={`tableDocViewRow-${key}-value`}
              /*
               * Justification for dangerouslySetInnerHTML:
               * We just use values encoded by our field formatters
               */
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: formattedValue as string }}
            />
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

  // Render the row value column supporting nested fields
  renderArrayValue = (value) => {
    if (arrayContainsObjects(value)) {
      const formatted = this.props?.indexPattern?.formatHit({ _index: value }, 'html')?._index;
      return trimAngularSpan(String(formatted));
    }
    else {
      return value.join(', ')
    }
  }

  getTable() {
    return (
      <div>
        <div>
          <EuiTable style={{ marginTop: 0 }} className='module-discover-table-details'>
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

  renderInfo(id, level, file, path, groups) {
    return (
      <EuiFlexGrid columns={4}>
        <EuiFlexItem key="id" grow={1}>
          <b style={{ paddingBottom: 6 }}>ID</b>
          <EuiToolTip position="top" content={`Filter by this rule ID: ${id}`}>
            <EuiLink
              onClick={async () => this.props.addFilter({ 'rule.id': id })}
            >
              {id}
            </EuiLink>
          </EuiToolTip>
        </EuiFlexItem>
        <EuiFlexItem key="level" grow={1}>
          <b style={{ paddingBottom: 6 }}>Level</b>
          <EuiToolTip position="top" content={`Filter by this level: ${level}`}>
            <EuiLink
              onClick={async () => this.props.addFilter({ "rule.level": level })}
            >
              {level}
            </EuiLink>
          </EuiToolTip>
        </EuiFlexItem>
        <EuiFlexItem key="file" grow={1}>
          <b style={{ paddingBottom: 6 }}>File</b>{file}
        </EuiFlexItem>
        <EuiFlexItem key="path" grow={1}>
          <b style={{ paddingBottom: 6 }}>Path</b>{path}
        </EuiFlexItem>
        <EuiFlexItem key="Groups" grow={1}><b style={{ paddingBottom: 6 }}>Groups</b>
          {this.renderGroups(groups)}
        </EuiFlexItem>
        <EuiSpacer size="s" />
      </EuiFlexGrid>
    );
  }

  renderGroups(groups) {
    const listGroups: any = [];
    groups.forEach((group, index) => {
      listGroups.push(
        <span key={group}>
          <EuiLink
            onClick={async () => this.props.addFilter({ 'rule.groups': group })}
          >
            <EuiToolTip
              position="top"
              content={`Filter by this group: ${group}`}
            >
              <span>{group}</span>
            </EuiToolTip>
          </EuiLink>
          {index < groups.length - 1 && ', '}
        </span>
      );
    });
    return (
      <ul>
        <li>
          {listGroups}
        </li>
      </ul>
    );
  }

  getValueAsString(value) {
    if (value && typeof value === 'object' && value.constructor === Object) {
      let list: any[] = [];
      Object.keys(value).forEach((key, idx) => {
        list.push(
          <span key={key}>
            {key}:&nbsp;
            {value[key]}
            {idx < Object.keys(value).length - 1 && ', '}
            <br />
          </span>
        );
      });
      return (
        <ul>
          <li>
            {list}
          </li>
        </ul>
      );
    } else {

      return value.toString();
    }
  }

  getFormattedDetails(value) {

    if (Array.isArray(value) && value[0].type) {
      let link = "";
      let name = "";

      value.forEach(item => {
        if (item.type === 'cve')
          name = item.name;
        if (item.type === 'link')
          link = <a href={item.name} target="_blank">{item.name}</a>
      })
      return <span>{name}: {link}</span>
    } else {
      const _value = typeof value === 'string' ? value : this.getValueAsString(value);
      return (
        <WzTextWithTooltipTruncated position='top'>
          {_value}
        </WzTextWithTooltipTruncated>
      );
    }
  }

  renderDetails(details) {
    const detailsToRender: any = [];
    const capitalize = str => str[0].toUpperCase() + str.slice(1);
    // Exclude group key of details
    Object.keys(details).filter(key => key !== 'group').forEach((key) => {
      detailsToRender.push(
        <EuiFlexItem key={key} grow={1} style={{ maxWidth: 'calc(25% - 24px)', maxHeight: 41 }}>
          <b style={{ paddingBottom: 6 }}>{capitalize(key)}</b>{details[key] === '' ? 'true' : this.getFormattedDetails(details[key])}
        </EuiFlexItem>
      );
    });
    return (
      <EuiFlexGrid columns={4}>
        {detailsToRender}
      </EuiFlexGrid>
    )
  }

  renderCompliance(compliance) {
    const styleTitle = { fontSize: "14px", fontWeight: 500 };
    return (
      <EuiFlexGrid columns={4}>
        {Object.keys(compliance).sort().map((complianceCategory, index) => {
          return (
            <EuiFlexItem key={`rule-compliance-${complianceCategory}-${index}`}>
              <div style={styleTitle}>{this.complianceEquivalences[complianceCategory]}</div>
              <div>
                {compliance[complianceCategory].map(comp => {
                  const filter = {
                    [this.getComplianceKey(complianceCategory)]: comp
                  };
                  return (
                    <EuiToolTip
                      key={`rule-compliance-tooltip-${complianceCategory}-${(Math.random() * (index - 0)) + index}`}
                      position="top"
                      content={`Filter by this compliance`}>
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
    );
  }

  getRule() {
    const item = this.state.ruleData.affected_items[0];
    const { id, level, file, path, groups, details } = item;
    const compliance = this.buildCompliance(item);
    return (
      <div className="rule_reset_display_anchor">
        <EuiSpacer size='s' />
        <EuiFlexGroup justifyContent='spaceAround'>
          <EuiFlexItem style={{ marginBottom: '8' }}>
            <EuiAccordion
              id="Info"
              buttonContent={
                <EuiTitle size="s" style={{ fontWeight: 400 }}>
                  <h3>Information</h3>
                </EuiTitle>
              }
              extraAction={
                <a href={`#/manager/rules?tab=rules&redirectRule=${id}`} target="_blank" style={{ paddingTop: 5 }}>
                  <EuiIcon type="popout" color='primary' />&nbsp;
                    View in Rules
                </a>
              }
              paddingSize="none"
              initialIsOpen={true}>
              <div className='flyout-row details-row'>
                {this.renderInfo(id, level, file, path, groups)}
              </div>
            </EuiAccordion>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='m' />
        <EuiFlexGroup>
          <EuiFlexItem style={{ marginTop: 8 }}>
            <EuiAccordion
              id="Details"
              buttonContent={
                <EuiTitle size="s">
                  <h3>Details</h3>
                </EuiTitle>
              }
              paddingSize="none"
              initialIsOpen={true}>
              <div className='flyout-row details-row'>
                {this.renderDetails(details)}
              </div>
            </EuiAccordion>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='m' />
        <EuiFlexGroup>
          <EuiFlexItem style={{ marginTop: 8 }}>
            <EuiAccordion
              id="Compliance"
              buttonContent={
                <EuiTitle size="s">
                  <h3>Compliance</h3>
                </EuiTitle>
              }
              paddingSize="none"
              initialIsOpen={true}>
              <div className='flyout-row details-row'>
                {this.renderCompliance(compliance)}
              </div>
            </EuiAccordion>
          </EuiFlexItem>
        </EuiFlexGroup>
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
            {this.state.selectedTabId === 'rule' && this.state.ruleData.total_affected_items === 1 && (
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
