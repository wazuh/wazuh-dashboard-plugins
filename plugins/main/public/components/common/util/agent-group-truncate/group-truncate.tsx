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

import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlexGrid,
  EuiLink,
  EuiBadge,
  EuiPopover,
} from '@elastic/eui';
import { endpointGroups } from '../../../../utils/applications';
import NavigationService from '../../../../react-services/navigation-service';

const ACTION = {
  REDIRECT: 'redirect',
  FILTER: 'filter',
} as const;

type ACTION = (typeof ACTION)[keyof typeof ACTION];

interface GroupTruncateProps {
  groups?: string[];
  label: string;
  length: number;
  action: ACTION;
  filterAction?: (group: string) => void;
}

export class GroupTruncate extends React.Component<GroupTruncateProps> {
  state: {
    popoverOpen: boolean;
  };

  constructor(props: GroupTruncateProps) {
    super(props);
    this.state = {
      popoverOpen: false,
    };
  }

  togglePopover() {
    this.setState({ popoverOpen: !this.state.popoverOpen });
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  action(group: string) {
    switch (this.props.action) {
      case ACTION.REDIRECT:
        return NavigationService.getInstance().navigateToApp(
          endpointGroups.id,
          {
            path: `#/manager/?tab=groups&group=${group}`,
          },
        );
      case ACTION.FILTER:
        return this.props.filterAction?.(group);
      default:
        console.error('Wrong property in GroupTruncate component');
        break;
    }
  }

  renderButton(quantity: number) {
    return (
      <EuiLink
        style={{ textDecoration: 'none', fontWeight: '400', fontSize: 'small' }}
        className={'no-focus'}
        onMouseDown={this.stopPropagation}
        onClick={(event: Event) => {
          event.stopPropagation();
          this.togglePopover();
        }}
      >
        &nbsp;{`+${quantity} ${this.props.label}`}
      </EuiLink>
    );
  }

  renderBadge(group: string, index: number) {
    return (
      <EuiBadge
        color={'hollow'}
        key={`agent-group-${index}`}
        onClickAriaLabel={`agent-group-${index}`}
        onMouseDown={this.stopPropagation}
        onClick={(event: Event) => {
          event.stopPropagation();
          this.action(group);
        }}
      >
        {group}
      </EuiBadge>
    );
  }

  renderGroups(groups: string[] = []) {
    const { length } = this.props;
    const auxGroups: React.ReactNode[] = [];
    const tooltipGroups: React.ReactNode[] = [];
    let auxLength = 0;
    let auxIndex = 0;
    if (groups.length >= 2 && groups.toString().length >= length) {
      groups.forEach((group, index) => {
        auxLength += group.length;
        if (auxLength >= length) {
          tooltipGroups.push(
            <EuiFlexItem grow={false} key={`agent-group-${index}`}>
              {this.renderBadge(group, index)}
            </EuiFlexItem>,
          );
          ++auxIndex;
        } else {
          auxGroups.push(this.renderBadge(group, index));
        }
      });
    } else {
      groups.forEach((group, index) => {
        auxGroups.push(this.renderBadge(group, index));
      });
    }
    const button = this.renderButton(auxIndex);
    return (
      <span style={{ display: 'inline' }}>
        {auxGroups}
        {auxIndex > 0 && (
          <EuiPopover
            button={button}
            isOpen={this.state.popoverOpen}
            closePopover={() => this.setState({ popoverOpen: false })}
          >
            <EuiFlexGroup style={{ maxWidth: '500px' }} gutterSize='none'>
              <EuiFlexItem grow={false}>
                <EuiFlexGrid columns={4} gutterSize={'s'}>
                  {tooltipGroups}
                </EuiFlexGrid>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPopover>
        )}
      </span>
    );
  }

  render() {
    return this.renderGroups(this.props.groups);
  }
}
