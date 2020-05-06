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

let toastID = 0;

const WzToastContext = React.createContext({});
WzToastContext.displayName = 'WzToastContext';

export class WzToastProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      toasts: []
    };
  }
  addToast(toast) {
    this.setState({
      toasts: this.state.toasts.concat({
        ...toast,
        id: `${toastID++}`
      })
    });
  }
  removeToast(toast) {
    this.setState({
      toasts: this.state.toasts.filter(t => t.id !== toast.id)
    });
  }
  clearToasts() {
    this.setState({
      toasts: []
    });
  }
  render() {
    return (
      <WzToastContext.Provider
        value={{
          // ...this.state,
          addToast: toast => this.addToast(toast)
        }}
      >
        {this.props.children}
        <EuiGlobalToastList
          toasts={this.state.toasts}
          dismissToast={toast => this.removeToast(toast)}
          toastLifeTimeMs={5000}
        />
      </WzToastContext.Provider>
    );
  }
}

export const withWzToast = WrappedComponent => props => (
  <WzToastContext.Consumer>
    {value => <WrappedComponent {...props} {...value} />}
  </WzToastContext.Consumer>
);

export default WzToastProvider;
