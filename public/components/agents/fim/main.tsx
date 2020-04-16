import React, { Component, Fragment } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiTab,
  EuiTabs,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import { States, Settings } from './index';
import { Events, Dashboard, Loader } from '../../common/modules';
import '../../common/modules/module.less';
import { ReportingService } from '../../../react-services/reporting';
import { getServices } from 'plugins/kibana/discover/kibana_services';
import { getAngularModule } from 'plugins/kibana/discover/kibana_services';

export class MainFim extends Component {
  state: {
    selectView: 'states' | 'events' | 'loader' | 'dashboard' | 'settings'
  };
  tabs = [
    { id: 'states', name: i18n.translate('wazuh.fim.states', { defaultMessage: 'States' }) },
    { id: 'events', name: i18n.translate('wazuh.fim.events', { defaultMessage: 'Events' }) },
  ]
  afterLoad = false;
  reportingService = new ReportingService();

  constructor(props) {
    super(props);
    this.state = {
      selectView: 'states',
    };
  }

  componentWillUnmount() {
    const { filterManager } = getServices();
    if (filterManager.filters && filterManager.filters.length) {
      filterManager.removeAll();
    }
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

  renderReportButton() {
    return (
      <EuiFlexItem grow={false}>
        <EuiButton
          iconType="document"
          onClick={() => this.reportingService.startVis2Png('fim', this.props.agent.id)}>
          Generate report
          </EuiButton>
      </EuiFlexItem>
    );
  }

  renderDashboardButton() {
    return (
      <EuiFlexItem grow={false} style={{ marginLeft: 0 }}>
        <EuiButton
          fill={this.state.selectView === 'dashboard'}
          iconType="visLine"
          onClick={() => this.onSelectedTabChanged('dashboard')}>
          Dashboard
          </EuiButton>
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

  checkFilterManager(filters) {
    const { filterManager } = getServices();
    if (filterManager.filters && filterManager.filters.length) {
      filterManager.addFilters([filters]);
      this.getDiscoverScope();
    } else {
      setTimeout(() => {
        this.checkFilterManager(filters);
      }, 200);
    }
  }

  loadEventsWithFilter(filters) {
    this.onSelectedTabChanged('events');
    this.checkFilterManager(filters);
  }

  loadSection(id) {
    this.setState({ selectView: id });
  }

  onSelectedTabChanged(id) {
    if (id === 'events' || id === 'dashboard') {
      window.location.href = window.location.href.replace(
        new RegExp("tabView=" + "[^\&]*"),
        `tabView=${id === 'events' ? 'discover' : 'panels'}`);
      this.afterLoad = id;
      this.loadSection('loader');
    } else {
      this.loadSection(id);
    }
  }

  render() {
    const { selectView } = this.state;
    const tabs = this.renderTabs();
    const reportButton = this.renderReportButton();
    const dashboardButton = this.renderDashboardButton();
    const settingsButton = this.renderSettingsButton();
    return (
      <Fragment>
        <div className='wz-module-header-nav-wrapper'>
          <div className='wz-module-header-nav'>
            <EuiFlexGroup>
              {tabs}
              {selectView === 'dashboard' && <Fragment>{reportButton}</Fragment>}
              {dashboardButton}
              {settingsButton}
            </EuiFlexGroup>
          </div>
        </div>
        <div className='wz-module-body'>
          {selectView === 'states' && <States {...this.props} loadEventsWithFilters={(filters) => this.loadEventsWithFilter(filters)} />}
          {selectView === 'events' && <Events {...this.props} section='fim' />}
          {selectView === 'loader' &&
            <Loader {...this.props}
              loadSection={(section) => this.loadSection(section)}
              redirect={this.afterLoad}>
            </Loader>}
          {selectView === 'dashboard' && <Dashboard {...this.props} section='fim' />}
          {selectView === 'settings' && <Settings {...this.props} />}
        </div>
      </Fragment>
    );
  }
}
