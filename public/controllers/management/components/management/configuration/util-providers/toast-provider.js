/*
 * Wazuh app - React provider of toast notifications.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import { EuiGlobalToastList } from '@elastic/eui';

let addToastHandler, removeToastHandler, removeAllToastsHandler;

export const addToast = toast => addToastHandler(toast);
export const removeToast = toast => removeToastHandler(toast);
export const removeAllToasts = toast => removeAllToastsHandler(toast);

let toastID = 0;

class WzToastProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      toasts: []
    };
    addToastHandler = this.addToast.bind(this);
    removeToastHandler = this.removeToast.bind(this);
    removeAllToastsHandler = this.removeAllToasts.bind(this);
  }
  addToast(toast) {
    this.setState({
      toasts: this.state.toasts.concat({ ...toast, id: `${toastID++}` })
    });
  }
  removeToast(removedToast) {
    this.setState({
      toasts: [
        ...this.state.toasts.filter(toast => toast.id !== removedToast.id)
      ]
    });
  }
  removeAllToasts() {
    this.setState({
      toasts: []
    });
  }
  render() {
    return (
      <EuiGlobalToastList
        toasts={this.state.toasts}
        dismissToast={toast => this.removeToast(toast)}
        toastLifeTimeMs={5000}
      />
    );
  }
}

export default WzToastProvider;
