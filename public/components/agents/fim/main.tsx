import React, { Component } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import { States, Settings } from './index';
import { Events, Dashboard, Loader } from '../../common/modules';
import '../../common/modules/module.less';
import { getServices } from 'plugins/kibana/discover/kibana_services';
import { getAngularModule } from 'plugins/kibana/discover/kibana_services';

export class MainFim extends Component {
  tabs = [
    { id: 'states', name: i18n.translate('wazuh.fim.states', { defaultMessage: 'States' }) },
    { id: 'events', name: i18n.translate('wazuh.fim.events', { defaultMessage: 'Events' }) },
  ]
  buttons = ['dashboard', 'reporting', 'settings']

  constructor(props) {
    super(props);
    this.props.loadSection('states');
    this.props.setTabs(this.tabs, this.buttons);
  }

  componentWillUnmount() {
    const { filterManager } = getServices();
    if (filterManager.filters && filterManager.filters.length) {
      filterManager.removeAll();
    }
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
    this.props.onSelectedTabChanged('events');
    this.checkFilterManager(filters);
  }

  render() {
    const { selectView } = this.props;
    if (selectView) {
      return (
        <div className='wz-module-body'>
          {selectView === 'states' &&
            <States {...this.props}
              loadEventsWithFilters={(filters) => this.loadEventsWithFilter(filters)}
            />}
          {selectView === 'events' && <Events {...this.props} />}
          {selectView === 'loader' &&
            <Loader {...this.props}
              loadSection={(section) => this.props.loadSection(section)}
              redirect={this.props.afterLoad}>
            </Loader>}
          {selectView === 'dashboard' && <Dashboard {...this.props} />}
          {selectView === 'settings' && <Settings {...this.props} />}
        </div>
      );
    } else {
      return false;
    }
  }
}
