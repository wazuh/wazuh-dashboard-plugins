
/*
 * Wazuh app - Integrity monitoring components
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
import { EuiPanel, EuiPage } from '@elastic/eui';
import { StatesTable, FilterBar } from './states/'

export class States extends Component {
  state: {
    filters: {}
  }
  constructor(props) {
    super(props);

    this.state = {
      filters: {}
    }
  }

  onFiltersChange(filters) {
    this.setState({ filters });
  }

  render() {
    const { filters } = this.state;
    return (
      <EuiPage>
        <EuiPanel>
          <div>States</div>
          <FilterBar
            onFiltersChange={this.onFiltersChange.bind(this)} />
          <StatesTable
            filters={filters} />
        </EuiPanel>
      </EuiPage>
    )
  }
}