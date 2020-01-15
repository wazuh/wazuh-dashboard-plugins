/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2019 Wazuh, Inc.
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

interface filter { field:string, value:string }

export interface Props {
  filters: filter[]
  onChange: (badge) => void
}

export class WzSearchBadges extends Component {
  props!: {
    filters: filter[]
    onChange: Function
  }
  constructor(props) {
    super(props);
  }

  buildBadge(title:filter) {
    const idGenerator = () => {return '_' + Math.random().toString(36).substr(2, 9)};
    return (
      <EuiBadge
        key={idGenerator()}
        iconType="cross"
        iconSide="right"
        iconOnClickAriaLabel="Remove"
        iconOnClick={() => this.props.onChange(title)}>
        {`${title.field}:${title.value}`}
      </EuiBadge>
    );
  }

  render() {
    const { filters } = this.props;
    const badges = filters.filter((item) => item.field !== 'q').map((item) => this.buildBadge(item))
    return (
      <div
        data-testid="search-badges" >
        {badges}
      </div>
    );
  }
}
