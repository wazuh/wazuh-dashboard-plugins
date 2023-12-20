import React, { useState } from 'react';
import { EuiFlexItem, EuiBadge, EuiConfirmModal } from '@elastic/eui';
import { getCore } from '../../../../kibana-services';
import { endpointGroups } from '../../../../utils/applications';
import { removeAgentFromGroupService } from '../../../endpoints-summary/services';
import { compose } from 'redux';
import { withErrorBoundary, withReduxProvider } from '../../hocs';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';

interface GroupTruncateBadgeProps {
  group: string;
  action: string;
  filterAction: (group: string) => void;
  allowRemove?: boolean;
  agent?: { id: string; name: string };
  reloadAgents?: () => void;
}

export const GroupTruncateBadge = compose(
  withErrorBoundary,
  withReduxProvider,
)((props: GroupTruncateBadgeProps) => {
  const { agent, group, action, filterAction, reloadAgents } = props;
  const allowRemove = props.allowRemove && agent && reloadAgents;

  const [isRemoveGroupModalVisible, setIsRemoveGroupModalVisible] =
    useState(false);
  const [isConfirmRemoveLoading, setIsConfirmRemoveLoading] = useState(false);

  const hadleOnClickGroup = () => {
    switch (action) {
      case 'redirect':
        return getCore().application.navigateToApp(endpointGroups.id, {
          path: `#/manager/?tab=groups&group=${group}`,
        });
      case 'filter':
        return filterAction(group);
      default:
        console.error('Wrong property in GroupTruncateBadge component');
        break;
    }
  };

  const handleOnCofirmRemove = async () => {
    if (!allowRemove) return;

    setIsConfirmRemoveLoading(true);

    try {
      await removeAgentFromGroupService(agent.id, group);
      reloadAgents();
    } catch (error) {
      const options = {
        context: `GroupTruncateBadge.removeAgentFromGroupService`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error,
          message: error.message || error,
          title: `Could not remove agent from group`,
        },
      };
      getErrorOrchestrator().handleError(options);
    } finally {
      setIsConfirmRemoveLoading(false);
      setIsRemoveGroupModalVisible(false);
    }
  };

  const removeModal =
    isRemoveGroupModalVisible && agent ? (
      <EuiConfirmModal
        title='Remove agent from group'
        onCancel={ev => {
          ev.stopPropagation();
          setIsRemoveGroupModalVisible(false);
        }}
        onConfirm={ev => {
          ev.stopPropagation();
          handleOnCofirmRemove();
        }}
        cancelButtonText='Cancel'
        confirmButtonText='Remove'
        buttonColor='danger'
        defaultFocusedButton='cancel'
        onClick={ev => {
          ev.stopPropagation();
        }}
        isLoading={isConfirmRemoveLoading}
      >
        <p>
          Remove agent <b>{agent.name}</b> from group <b>{group}</b>?
        </p>
      </EuiConfirmModal>
    ) : null;

  return (
    <EuiFlexItem grow={false}>
      <EuiBadge
        color='hollow'
        onClick={ev => {
          ev.stopPropagation();
          hadleOnClickGroup();
        }}
        onClickAriaLabel={`agent-group-${group}`}
        iconType={allowRemove ? 'cross' : null}
        iconSide='right'
        iconOnClick={ev => {
          ev.stopPropagation();
          setIsRemoveGroupModalVisible(true);
        }}
        iconOnClickAriaLabel={`agent-remove-group-${group}`}
      >
        {group}
      </EuiBadge>
      {removeModal}
    </EuiFlexItem>
  );
});
