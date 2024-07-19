/*
 * Wazuh app - React component for groups.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
//Wazuh groups overview
import WzGroupsOverview from './groups-overview';
import WzGroupDetail from './group-detail';
import WzGroupEditor from './groups-editor';
import { updateGroupDetail } from '../../../../../redux/actions/groupsActions';
import {
  updateShowAddAgents,
  resetGroup,
} from '../../../../../redux/actions/groupsActions';
import { connect } from 'react-redux';
import { WzRequest } from '../../../../../react-services/wz-request';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import { compose } from 'redux';
import {
  withGlobalBreadcrumb,
  withRouterSearch,
} from '../../../../../components/common/hocs';
import { endpointGroups } from '../../../../../utils/applications';
import { MultipleAgentSelector } from '../../../../../components/management/groups/multiple-agent-selector';
import NavigationService from '../../../../../react-services/navigation-service';

class WzGroups extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    // Check if there is a group in the URL
    const { group } = this.props.search;
    if (group) {
      try {
        // Try if the group can be accesed
        const responseGroup = await WzRequest.apiReq('GET', '/groups', {
          params: { groups_list: group },
        });
        const dataGroup = responseGroup?.data?.data?.affected_items?.[0];
        this.props.updateGroupDetail(dataGroup);
        NavigationService.getInstance().updateAndNavigateSearchParams({
          group: null,
        });
      } catch (error) {
        const options = {
          context: `${WzGroups.name}.componentDidMount`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.CRITICAL,
          store: true,
          error: {
            error: error,
            message: error.message || error,
            title: `Error accessing the group`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.state.showAddAgents) {
      this.props.updateShowAddAgents(false);
    }
  }
  componentWillUnmount() {
    // When the component is going to be unmounted the groups state is reset
    this.props.resetGroup();
  }

  render() {
    const { itemDetail, showAddAgents, fileContent } = this.props.state;
    return (
      <>
        {!showAddAgents &&
          ((itemDetail && !fileContent && <WzGroupDetail {...this.props} />) ||
            (fileContent && <WzGroupEditor />) || <WzGroupsOverview />)}
        {showAddAgents && itemDetail && (
          <MultipleAgentSelector
            currentGroup={itemDetail}
            cancelButton={() => this.props.updateShowAddAgents(false)}
          />
        )}
      </>
    );
  }
}
const mapStateToProps = state => {
  return {
    state: state.groupsReducers,
  };
};
const mapDispatchToProps = dispatch => {
  return {
    resetGroup: () => dispatch(resetGroup()),
    updateShowAddAgents: showAddAgents =>
      dispatch(updateShowAddAgents(showAddAgents)),
    updateGroupDetail: groupDetail => dispatch(updateGroupDetail(groupDetail)),
  };
};
export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withGlobalBreadcrumb(props => {
    return [{ text: endpointGroups.breadcrumbLabel }];
  }),
  withRouterSearch,
)(WzGroups);
