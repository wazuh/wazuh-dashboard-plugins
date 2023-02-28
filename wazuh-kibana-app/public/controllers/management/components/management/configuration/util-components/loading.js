/*
 * Wazuh app - React component for render loading.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';

import { EuiSpacer, EuiProgress } from '@elastic/eui';

class WzLoading extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <Fragment>
        <EuiSpacer size="m" />
        <EuiProgress size="xs" color="primary" />
        <EuiSpacer size="m" />
      </Fragment>
    );
  }
}

export default WzLoading;
