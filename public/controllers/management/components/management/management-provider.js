import React, { Component } from 'react';
// Redux
import store from '../../../../redux/store';
import WzReduxProvider from '../../../../redux/wz-redux-provider';
import WzManagementMain from '../management/management-main';

export default class WzManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.store = store;
  }

  render() {
    return (
      <WzReduxProvider>
        <WzManagementMain {...this.props} />
      </WzReduxProvider>
    );
  }
}
