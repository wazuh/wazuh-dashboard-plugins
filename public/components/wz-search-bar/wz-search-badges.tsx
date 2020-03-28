/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, {
  Component,
} from 'react';
import { EuiBadge } from '@elastic/eui';
import { QInterpreter } from './lib/q-interpreter';

interface iFilter { field:string, value:string }

export interface Props {
  filters: iFilter[]
  onChange: (badge) => void
}

export class WzSearchBadges extends Component {
  props!: {
    filters: iFilter[]
    onChange: Function
  }
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.filters.lenght !== this.props.filters.length) {
      return true;
    }
    return false;
  }

  
  idGenerator() {
    return '_' + Math.random().toString(36).substr(2, 9)
  }

  buildBadge(filter:iFilter) {
    if (filter.field === 'q') { return this.buildQBadges(filter); }
    return (
      <EuiBadge
        key={this.idGenerator()}
        iconType="cross"
        iconSide="right"
        iconOnClickAriaLabel="Remove"
        color="hollow"
        className="globalFilterItem"
        iconOnClick={() => this.props.onChange(filter)}>
        {`${filter.field}:${filter.value}`}
      </EuiBadge>
    );
  }

  buildQBadges(filter:iFilter) {
    const qInterpreter = new QInterpreter(filter.value);
    console.log(qInterpreter.queryObjects)
    const qBadges = qInterpreter.queryObjects.map((qFilter,index) => (
      <EuiBadge
        key={this.idGenerator()}
        iconType="cross"
        iconSide="right"
        iconOnClickAriaLabel="Remove"
        iconOnClick={()=> console.log(index, qFilter)}>
        {qFilter.conjuntion} {qFilter.field} {qFilter.operator} {qFilter.value}
      </EuiBadge>
    ));
    return qBadges;
  }
  
  render() {
    const { filters } = this.props;
    const badges = filters.map((item) => this.buildBadge(item))
    return (
      <div
        data-testid="search-badges" >
        {badges}
      </div>
    );
  }
}
