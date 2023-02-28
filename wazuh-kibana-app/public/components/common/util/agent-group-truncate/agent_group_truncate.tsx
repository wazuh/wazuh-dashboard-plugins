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
  EuiToolTip,
  EuiLink
} from '@elastic/eui';

export class AgentGroupTruncate extends React.Component {
  _isMount = false;
  props!: {
    [key: string]: any
  }
  state: {
    groups: any
  }
  constructor(props) {
    super(props);
    this.state = {
      groups: ''
    }
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
        tooltipGroups.push(`${group}${index === (groups.length-1) ? '' : ', '}`);
        ++auxIndex;
      } else {
        auxGroups.push(`${group}${index === (groups.length-1) ? '' : ', '}`);
      }
    });
  } else {
    groups.map( (group, index) => {
      auxGroups.push(`${group}${index === (groups.length-1) ? '' : ', '}`)
    })
  }
    return (
      <div style={{display: 'inline'}}>
        {auxGroups}
        {auxIndex > 0 && 
          <EuiToolTip
          key={auxIndex}
          content={tooltipGroups}
          >
            <EuiLink style={{textDecoration: 'none'}}>
              &nbsp;{`+${auxIndex} ${this.props.label}`}
            </EuiLink>
          </EuiToolTip>
        }
      </div>
    );
  }

  render() {
    const groups = this.renderGroups(this.props.groups)
    return (
    <Fragment>
      {groups}
    </Fragment>
    )
  }
}