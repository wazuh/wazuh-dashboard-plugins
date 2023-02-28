/*
 * Wazuh app - React component for Dev Tools.
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

import {
} from '@elastic/eui';
import { DevTools } from './devtools'
import { AppState } from '../../../react-services/app-state';

export class MainDevTools extends Component {
  constructor(props) {
    super(props);

    this.state = {
    };
    this.initialTextValue = AppState.getCurrentDevTools();
  }


  render(){
    return (
      <div>
        <DevTools initialTextValue={this.initialTextValue} />
      </div>
      )
  }
} 