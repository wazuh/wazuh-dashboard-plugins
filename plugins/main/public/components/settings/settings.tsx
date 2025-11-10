/*
 * Wazuh app - Settings controller
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from 'react';
import { updateGlobalBreadcrumb } from '../../redux/actions/globalBreadcrumbActions';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { getWzCurrentAppID } from '../../kibana-services';
import { ApiTable } from '../settings/api/api-table';
import { WzConfigurationSettings } from '../settings/configuration';
import { WzSampleDataWrapper } from '../add-modules-data/WzSampleDataWrapper';
import { SettingsAbout } from '../settings/about/index';
import { Applications, serverApis } from '../../utils/applications';
import { compose } from 'redux';
import { withErrorBoundary, withRouteResolvers } from '../common/hocs';
import { connect } from 'react-redux';
import { nestedResolve } from '../../services/resolves';
import { Route, Switch } from '../router-search';
import { useRouterSearch } from '../common/hooks';
import { AppInfo } from './types';

const mapStateToProps = state => ({
  configurationUIEditable:
    state.appConfig.data['configuration.ui_api_editable'],
});

const mapDispatchToProps = dispatch => ({
  updateGlobalBreadcrumb: breadcrumb =>
    dispatch(updateGlobalBreadcrumb(breadcrumb)),
});

export const Settings = compose(
  withErrorBoundary,
  withRouteResolvers({ nestedResolve }),
  connect(mapStateToProps, mapDispatchToProps),
)(props => {
  const { tab } = useRouterSearch();
  return <SettingsComponent {...props} tab={tab} />;
});

interface SettingsComponentProps {
  tab: string;
  configurationUIEditable: boolean;
  updateGlobalBreadcrumb: (breadcrumb: { text: string }[]) => void;
}

class SettingsComponent extends React.Component<SettingsComponentProps> {
  appInfo: AppInfo | undefined;

  constructor(props: SettingsComponentProps) {
    super(props);
  }

  async componentDidMount(): Promise<void> {
    try {
      const urlTab = this.props.tab;

      if (urlTab) {
        const tabActiveName = Applications.find(
          ({ id }) => getWzCurrentAppID() === id,
        ).breadcrumbLabel;
        const breadcrumb = [{ text: tabActiveName }];
        this.props.updateGlobalBreadcrumb(breadcrumb);
      } else {
        const breadcrumb = [{ text: serverApis.breadcrumbLabel }];
        this.props.updateGlobalBreadcrumb(breadcrumb);
      }
    } catch (error) {
      const options = {
        context: `${Settings.name}.onInit`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Cannot initialize Settings`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  render() {
    return (
      <Switch>
        <Route path='?tab=api'>
          <div>
            <div>
              <ApiTable />
            </div>
          </div>
        </Route>
        <Route path='?tab=about'>
          <div>
            <SettingsAbout />
          </div>
        </Route>
        <Route path='?tab=sample_data'>
          <div>
            <WzSampleDataWrapper />
          </div>
        </Route>
      </Switch>
    );
  }
}
