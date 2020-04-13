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

import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import {
  EuiButtonEmpty,
} from '@elastic/eui';
import { getAngularModule } from 'plugins/kibana/discover/kibana_services';
import { EventsSelectedFiles } from './events-selected-fields'
import { FlyoutDetail } from '../../agents/fim/states/flyout';
export class Events extends Component {
  state: {
    isFlyoutVisible: Boolean
  };
  constructor(props) {
    super(props);
    this.state = {
      isFlyoutVisible: false,
    }
  }

  async getRowsField(scope, index) {
    this.elements = document.querySelectorAll(`.kbn-table tbody tr td:nth-child(${index}) div`);
    if ((scope.rows || []).length && (this.elements || {}).length) {
      this.forceUpdate();
    } else if ((scope.rows || []).length) {
      setTimeout(() => { this.getRowsField(scope, index) }, 200);
    }
  }

  async getDiscoverScope() {
    const app = getAngularModule('app/wazuh');
    if (app.discoverScope && app.discoverScope.removeColumn) {
      app.discoverScope.removeColumn('_source');
      const fields = EventsSelectedFiles[this.props.section];
      fields.forEach(field => {
        if (!app.discoverScope.state.columns.includes(field)) {
          app.discoverScope.addColumn(field);
        }
      });
      app.discoverScope.$watchCollection('rows',
        () => {
          this.getRowsField(app.discoverScope, 3);
        });
    } else {
      setTimeout(() => { this.getDiscoverScope() }, 200);
    }
  }

  async componentDidMount() {
    const app = getAngularModule('app/wazuh');
    this.$rootScope = app.$injector.get('$rootScope');
    this.$rootScope.showModuleEvents = this.props.section;
    this.$rootScope.$applyAsync();
    this.getDiscoverScope();
  }

  componentWillUnmount() {
    this.$rootScope.showModuleEvents = false;
    this.$rootScope.$applyAsync();
  }

  showFlyout(file) {
    //if a flyout is opened, we close it and open a new one, so the components are correctly updated on start.
    this.setState({ isFlyoutVisible: false }, () => this.setState({ isFlyoutVisible: true, currentFile: file }));
  }
  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentFile: false });
  }

  render() {
    return (
      <Fragment>
        {this.elements &&
          [...this.elements].map(element => {
            const file = element.textContent;
            if (element.firstChild.tagName === 'SPAN') {
              element.removeChild(element.firstChild);
            }
            return (
              ReactDOM.createPortal(
                <Fragment>
                  <EuiButtonEmpty
                    style={{ height: 20, fontSize: '12px' }}
                    size="xs"
                    onClick={() => this.showFlyout(file)}>
                    {file}
                  </EuiButtonEmpty>
                </Fragment>
                ,
                element
              )
            )
          }
          )
        }
        {this.state.isFlyoutVisible &&
          <FlyoutDetail
            fileName={this.state.currentFile}
            agentId={this.props.agent.id}
            closeFlyout={() => this.closeFlyout()}
            {...this.props}>
          </FlyoutDetail>
        }
      </Fragment>
    )
  }
}
