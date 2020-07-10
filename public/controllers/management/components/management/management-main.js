/*
 * Wazuh app - React component for all management section.
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
// Redux
import store from '../../../../redux/store';
import ReactDOM from 'react-dom';
import { updateRulesetSection } from '../../../../redux/actions/rulesetActions';
import { showFlyoutLogtest  } from '../../../../redux/actions/appStateActions';
import WzRuleset from './ruleset/main-ruleset';
import WzGroups from './groups/groups-main';
import WzStatus from './status/status-main';
import WzLogs from './mg-logs/logs';
import WzReporting from './reporting/reporting-main';
import WzConfiguration from './configuration/configuration-main';
import WzStatistics from './statistics/statistics-main';
import { LogtestFlyout } from '../../../../components/tools/logtest/logtest-flyout'
import { connect } from 'react-redux';
import { EuiBetaBadge } from '@elastic/eui';

class WzManagementMain extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      isDocked: true
    };
    this.store = store;
  }
  UNSAFE_componentWillMount() {
    this.props.updateRulesetSection(this.props.section);
  }

  componentWillUnmount() {
    store.dispatch(updateRulesetSection(''));
  }

  buildLogtestButton() {
    const breadcrumbExists = document.getElementsByClassName('wz-global-breadcrumb');
    if (!breadcrumbExists.length) {
      setTimeout(() => {
        this.buildLogtestButton();
      }, 500);
    } else {
      const container = document.getElementsByClassName('euiBreadcrumbs');
      return ReactDOM.createPortal(
        <EuiBetaBadge
          label="Test ruleset"
          title="Logtest tool"
          tooltipContent="Check your ruleset testing logs"
          style={{ margin: '0px 8px', cursor: 'pointer' }}
          onClick={() => this.switchLogtestFlyout()}
        />,
        container[0]
      );
    }
  }

  switchLogtestFlyout() {
    this.props.showFlyoutLogtest(!this.props.showLogtestFlyout);
  }

  render() {
    const { section } = this.props;
    const ruleset = ['ruleset', 'rules', 'decoders', 'lists'];
    return (
      <Fragment>
        {(section === 'groups' && <WzGroups {...this.props} />) ||
          (section === 'status' && <WzStatus />) ||
          (section === 'reporting' && <WzReporting />) ||
          (section === 'statistics' && <WzStatistics />) ||
          (section === 'logs' && <WzLogs />) ||
          (section === 'configuration' && <WzConfiguration {...this.props.configurationProps} />) ||
          (ruleset.includes(section) && <WzRuleset />)
        }
        {ruleset.includes(section) &&
          <Fragment>
            {!this.props.showLogtestFlyout &&
              this.buildLogtestButton()
            }
          </Fragment>
        }
      </Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    state: state.managementReducers,
    showFlyout: state.appStateReducers.showFlyoutLogtest,
  };
}

const mapDispatchToProps = dispatch => {
  return {
    updateRulesetSection: section => dispatch(updateRulesetSection(section)),
    showFlyoutLogtest: showFlyout => dispatch(showFlyoutLogtest(showFlyout)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzManagementMain);
