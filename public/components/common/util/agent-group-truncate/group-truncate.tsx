/*
 * Wazuh app - React Component to cut text strings of several elements that exceed a certain number of length.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Fragment } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlexGrid,
  EuiLink,
  EuiBadge,
  EuiPopover
} from '@elastic/eui';

export class GroupTruncate extends React.Component {
  _isMount = false;
  state: {
    groups: any,
    popoverOpen: boolean
  }
  props!: {
    label: String,
    length: number,
    agent: Object,
    action: String,
    filterAction: any
  }
  
  constructor(props) {
    super(props);
    this.state = {
      groups: '',
      popoverOpen: false,
    }
  }

  filterAction(group) {
    this.props.filterAction(group);
  }

  action(index, group) {
    switch (this.props.action) {
      case 'redirect':
        return this.props.goGroups(this.props.agent, index);
      case 'filter':
        return this.filterAction(group);
      default:
        console.error('Wrong property in GroupTruncate component');
        break;
    }
  }

  renderButton(auxIndex) {
    return (
      <EuiLink
        style={{textDecoration: 'none'}}
        className={'no-focus'}
        onMouseDown={ (ev) => { ev.stopPropagation() }}
        onClick={ (ev) => {
          ev.stopPropagation();
          this.setState({popoverOpen: !this.state.popoverOpen})
        }}>
        &nbsp;{`+${auxIndex} ${this.props.label}`}
      </EuiLink>
    )
  }

  renderBadge(group, index) {
    return (
      <EuiBadge
        color={'hollow'}
        key={`agent-group-${index}`}
        onClickAriaLabel={`agent-group-${index}`}
        onMouseDown={ (ev) => { ev.stopPropagation() }}
        onClick={
          (ev) => {
            ev.stopPropagation();
            this.action(index, group);
          }
        }>
        {group}
      </EuiBadge>
    )
  }

  renderGroups(groups) {
    const { length } = this.props;
    let auxGroups: Array<String> = [];
    let tooltipGroups: Array<String> = []
    let auxLength = 0;
    let auxIndex = 0;
    if (groups.length >= 2 && groups.toString().length >= length) {
      groups.map( (group, index) => {
        auxLength = auxLength + group.length;
        if (auxLength >= length ) {
          tooltipGroups.push(
            <EuiFlexItem grow={1} key={`agent-group-${index}`}>
              {this.renderBadge(group, index)}
            </EuiFlexItem>
          );
          ++auxIndex;
        } else {
          auxGroups.push(
            this.renderBadge(group, index)
          );
        }
      });
    } else {
      groups.map( (group, index) => {
        auxGroups.push(
          this.renderBadge(group, index)
        )
      })
    }
    const button = this.renderButton(auxIndex);
    return (
      <span style={{display: 'inline'}}>
        <Fragment>
          {auxGroups}
        </Fragment>
        {auxIndex > 0 && 
          <EuiPopover
            button={button}
            isOpen={this.state.popoverOpen}
            closePopover={() => this.setState({popoverOpen: false})}>
            <EuiFlexGroup style={{ maxWidth: '500px' }} gutterSize="none">
              <EuiFlexItem grow={false}>
                <EuiFlexGrid columns={4} gutterSize={'s'}>
                  {tooltipGroups}
                </EuiFlexGrid>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPopover>
        }
      </span>
    );
  }
  
  render() {
    const groups = this.renderGroups(this.props.groups)
    return (
      groups
    )
  }
}
