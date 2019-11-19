import React, { Component } from 'react';
// Redux
import store from '../../../../redux/store';
import WzReduxProvider from '../../../../redux/wz-redux-provider';
import WzManagement from '../management/management-main'

export default class WzManagementProvider extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.store = store;
    }

    render() {
        return (
            <WzReduxProvider>
                <WzManagement />
            </WzReduxProvider>
        )
    }
}