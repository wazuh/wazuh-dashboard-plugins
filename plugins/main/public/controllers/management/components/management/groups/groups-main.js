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
import { i18n } from '@osd/i18n';
import { EuiConfirmModal, EuiOverlayMask } from '@elastic/eui';
//Wazuh groups overview
import WzGroupsOverview from './groups-overview';
import WzGroupDetail from './group-detail';
import WzGroupEditor from './groups-editor';
import { updateGroupDetail } from '../../../../../redux/actions/groupsActions';
import {
  updateShowAddAgents,
  resetGroup,
  cleanFileContent,
  updateShowDiscardChangesModal,
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
  withUserAuthorizationPrompt,
} from '../../../../../components/common/hocs';
import { endpointGroups } from '../../../../../utils/applications';
import { ManageAgents } from '../../../../../components/management/groups/manage-agents';
import NavigationService from '../../../../../react-services/navigation-service';

export class WzGroups extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  getGroupDetail = async () => {
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
      } catch (error) {
        const options = {
          context: `${WzGroups.name}.componentDidMount`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error: error,
            message: error.message || error,
            title: i18n.translate(
              'wazuh.endpointGroups.main.errorAccessingGroupTitle',
              { defaultMessage: 'Error accessing the group' },
            ),
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }
  };
  async componentDidMount() {
    await this.getGroupDetail();
  }

  async componentDidUpdate(prevProps) {
    if (this.props.search?.group !== prevProps.search?.group) {
      if (this.props.search?.group === undefined) {
        // Leaving the group also closes the file editor opened from it
        this.props.cleanFileContent();
        this.props.updateGroupDetail(false);
      } else {
        await this.getGroupDetail();
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

  closeDiscardModal = () => this.props.updateShowDiscardChangesModal(false);

  confirmDiscard = () => {
    this.closeDiscardModal();
    NavigationService.getInstance().updateAndNavigateSearchParams({
      group: null,
    });
  };

  render() {
    const { itemDetail, showAddAgents, fileContent, showDiscardChangesModal } =
      this.props.state;
    return (
      <>
        {showDiscardChangesModal && (
          <EuiOverlayMask>
            <EuiConfirmModal
              title={i18n.translate(
                'wazuh.endpointGroups.editor.unsavedChangesModalTitle',
                { defaultMessage: 'Unsubmitted changes' },
              )}
              onConfirm={this.confirmDiscard}
              onCancel={this.closeDiscardModal}
              cancelButtonText={i18n.translate(
                'wazuh.endpointGroups.editor.unsavedChangesModalCancel',
                { defaultMessage: "No, don't do it" },
              )}
              confirmButtonText={i18n.translate(
                'wazuh.endpointGroups.editor.unsavedChangesModalConfirm',
                { defaultMessage: 'Yes, do it' },
              )}
            >
              <p style={{ textAlign: 'center' }}>
                {i18n.translate(
                  'wazuh.endpointGroups.editor.unsavedChangesModalBody',
                  {
                    defaultMessage:
                      'There are unsaved changes. Are you sure you want to proceed?',
                  },
                )}
              </p>
            </EuiConfirmModal>
          </EuiOverlayMask>
        )}
        {!showAddAgents &&
          ((itemDetail && !fileContent && <WzGroupDetail {...this.props} />) ||
            (fileContent && <WzGroupEditor />) || <WzGroupsOverview />)}
        {showAddAgents && itemDetail && (
          <ManageAgents
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
    cleanFileContent: () => dispatch(cleanFileContent()),
    updateShowDiscardChangesModal: show =>
      dispatch(updateShowDiscardChangesModal(show)),
    updateShowAddAgents: showAddAgents =>
      dispatch(updateShowAddAgents(showAddAgents)),
    updateGroupDetail: groupDetail => dispatch(updateGroupDetail(groupDetail)),
  };
};
export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withGlobalBreadcrumb(props => {
    return props.state?.itemDetail
      ? [
          {
            text: endpointGroups.breadcrumbLabel,
            onClick: ev => {
              ev.preventDefault();
              // Leaving the group would silently drop the unsaved editor changes
              if (props.state?.fileEditorHasChanges) {
                props.updateShowDiscardChangesModal(true);
                return;
              }
              NavigationService.getInstance().updateAndNavigateSearchParams({
                group: null,
              });
            },
          },
          { text: props.state?.itemDetail.name },
        ]
      : [{ text: endpointGroups.breadcrumbLabel }];
  }),
  withRouterSearch,
  withUserAuthorizationPrompt([
    { action: 'group:read', resource: 'group:id:*' },
  ]),
)(WzGroups);
