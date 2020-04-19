import React, { Component } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import { States } from './index';
import '../../common/modules/module.less';
import { getServices } from 'plugins/kibana/discover/kibana_services';
import { ModulesHelper } from '../../common/modules/modules-helper'

export class MainFim extends Component {
  tabs = [
    { id: 'states', name: i18n.translate('wazuh.fim.states', { defaultMessage: 'States' }) },
    { id: 'events', name: i18n.translate('wazuh.fim.events', { defaultMessage: 'Events' }) },
  ]
  buttons = ['dashboard', 'reporting', 'settings']

  constructor(props) {
    super(props);
    this.modulesHelper = ModulesHelper;
  }

  async checkFilterManager(filters) {
    const { filterManager } = getServices();
    if (filterManager.filters && filterManager.filters.length) {
      filterManager.addFilters([filters]);
      const scope = await this.modulesHelper.getDiscoverScope();
      scope.updateQueryAndFetch({ query: null });
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
        <div>
          {selectView === 'states' &&
            <States {...this.props}
              loadEventsWithFilters={(filters) => this.loadEventsWithFilter(filters)}
            />}
        </div>
      );
    } else {
      return false;
    }
  }
}
