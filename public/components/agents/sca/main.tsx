import React, { Component, Fragment } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiTab,
  EuiTabs,
} from '@elastic/eui';
import { States, Settings } from './index';
import { Events, Loader } from '../../common/modules';

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
    const tabs = this.renderTabs();
    const settingsButton = this.renderSettingsButton();
    return (
      <Fragment>
        <div className='wz-module-header-nav-wrapper'>
          <div className='wz-module-header-nav'>
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
      </Fragment>
    );
  }
}
