
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
import { StatesTable } from './states/table'

export class States extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <section>
        <div>States</div>
        <StatesTable />
      </section>
    )
  }
}