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
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiHealth,
  EuiTab,
  EuiTabs,
  EuiTitle,
  EuiToolTip,
  EuiCallOut
} from '@elastic/eui';
import { States, Settings } from './index';
import { Events, Loader } from '../../common/modules';
import '../../common/modules/module.less';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import store from '../../../redux/store';
import chrome from 'ui/chrome';
import { getAngularModule } from 'plugins/kibana/discover/kibana_services';

export class MainSca extends Component {
  state: {
    selectView: 'states' | 'events' | 'loader' | 'settings'
  };
  tabs = [
    { id: 'states', name: 'States' },
    { id: 'events', name: 'Events' },
  ]
  afterLoad = false;

  constructor(props) {
    super(props);
    this.state = {
      selectView: 'states',
    };
  }

  setGlobalBreadcrumb() {
    const breadcrumb = [
      {
        text: '',
      },
      {
        text: 'Agents',
        href: "#/agents-preview"
      },
      {
        text: `${this.props.agent.name} (${this.props.agent.id})`,
        onClick: () => {
          window.location.href = `#/agents?agent=${this.props.agent.id}`;
          this.router.reload();
        },
        className: 'wz-global-breadcrumb-btn',
        truncate: true,
      },
      {
        text: 'Security configuration assessment',
      },
    ];
    store.dispatch(updateGlobalBreadcrumb(breadcrumb));
  }

  async componentDidMount() {
    this.setGlobalBreadcrumb();
    const $injector = await chrome.dangerouslyGetActiveInjector();
    this.router = $injector.get('$route');
  }

  color = (status) => {
    if (status.toLowerCase() === 'active') { return 'success'; }
    else if (status.toLowerCase() === 'disconnected') { return 'danger'; }
    else if (status.toLowerCase() === 'never connected') { return 'subdued'; }
  }

  renderTitle() {
    return (
      <EuiFlexGroup>
        <EuiFlexItem className="wz-module-header-title">
          <EuiTitle size="s">
            <h1>
              <EuiToolTip position="right" content={this.props.agent.status}>
                <EuiHealth color={this.color(this.props.agent.status)}></EuiHealth>
              </EuiToolTip>
              {this.props.agent.name} ({this.props.agent.id}) - <b>Security configuration assessment</b>
            </h1>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  renderTabs() {
    const { selectView } = this.state;
    return (
      <EuiFlexItem>
        <EuiTabs display="condensed">
          {this.tabs.map((tab, index) =>
            <EuiTab
              onClick={() => this.onSelectedTabChanged(tab.id)}
              isSelected={selectView === tab.id}
              key={index}
            >
              {tab.name}
            </EuiTab>
          )}
        </EuiTabs>
      </EuiFlexItem>
    );
  }

  renderSettingsButton() {
    return (
      <EuiFlexItem grow={false} style={{ marginLeft: 0 }}>
        <EuiButton
          fill={this.state.selectView === 'settings'}
          iconType="wrench"
          onClick={() => this.onSelectedTabChanged('settings')}>
          Configuration
          </EuiButton>
      </EuiFlexItem>
    );
  }

  getDiscoverScope() {
    const app = getAngularModule('app/wazuh');
    if (app.discoverScope) {
      app.discoverScope.updateQueryAndFetch({ query: null });
    } else {
      setTimeout(() => { this.getDiscoverScope() }, 200);
    }
  }

  loadSection(id) {
    this.setState({ selectView: id });
  }

  onSelectedTabChanged(id) {
    if (id === 'events') {
      window.location.href = window.location.href.replace(
        new RegExp("tabView=" + "[^\&]*"),
        "tabView=discover");
      this.afterLoad = id;
      this.loadSection('loader');
    } else {
      this.loadSection(id);
    }
  }

  render() {
    const { selectView } = this.state;
    const title = this.renderTitle();
    const tabs = this.renderTabs();
    const settingsButton = this.renderSettingsButton();
    return (
      <Fragment>
        {(this.props.agent && this.props.agent.os) &&
          <div className='wz-module'>
            <div className='wz-module-header-wrapper'>
              <div className='wz-module-header'>
                {title}
                <EuiFlexGroup>
                  {tabs}
                  {settingsButton}
                </EuiFlexGroup>
              </div>
            </div>
            <div className='wz-module-body'>
              {selectView === 'states' && <States {...this.props} />}
              {selectView === 'events' && <Events {...this.props} section='sca' />}
              {selectView === 'loader' &&
                <Loader {...this.props}
                  loadSection={(section) => this.loadSection(section)}
                  redirect={this.afterLoad}>
                </Loader>}
              {selectView === 'settings' && <Settings {...this.props} />}
            </div>
          </div>
        }
        {(!this.props.agent || !this.props.agent.os) &&
          <EuiCallOut title=" This agent has never connected" color="warning" iconType="alert">
          </EuiCallOut>
        }
      </Fragment>
    );
  }
}
