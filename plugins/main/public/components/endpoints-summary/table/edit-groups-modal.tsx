import React, { useState } from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButtonEmpty,
  EuiButton,
  EuiForm,
  EuiFormRow,
  EuiComboBox,
  EuiText,
} from '@elastic/eui';
import { compose } from 'redux';
import { withErrorBoundary, withReduxProvider } from '../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { useGetGroups } from '../hooks/groups';

interface EditAgentGroupsModalProps {
  agent: { id: string; name: string; group: string[] };
  onClose: () => void;
  reloadAgents: () => void;
}

export const EditAgentGroupsModal = compose(
  withErrorBoundary,
  withReduxProvider,
)(({ agent, onClose, reloadAgents }: EditAgentGroupsModalProps) => {
  const [selectedGroups, setSelectedGroups] = useState(
    agent.group?.map(group => ({ label: group })) || [],
  );
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const {
    groups,
    isLoading: isGroupsLoading,
    error: errorGroups,
  } = useGetGroups();

  if (errorGroups) {
    const options = {
      context: `EditAgentGroupsModal.useGetGroups`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error,
        message: error.message || error,
        title: `Could not get groups`,
      },
    };
    getErrorOrchestrator().handleError(options);
  }

  const handleOnCofirm = async () => {
    setIsConfirmLoading(true);

    try {
      // await addAgentToGroupService(agent.id, group);
      reloadAgents();
    } catch (error) {
      const options = {
        context: `EditAgentGroupsModal.addAgentToGroupService`,
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
      setIsConfirmLoading(false);
    }
  };

  const form = (
    <EuiForm component='form'>
      <EuiFormRow label='Agent'>
        <EuiText>
          <b>{agent.name}</b>
        </EuiText>
      </EuiFormRow>
      <EuiFormRow label='Groups'>
        <EuiComboBox
          placeholder='Select groups'
          options={groups?.map(group => ({ label: group })) || []}
          selectedOptions={selectedGroups}
          onChange={selectedGroups => setSelectedGroups(selectedGroups)}
          isLoading={isGroupsLoading}
        />
      </EuiFormRow>
    </EuiForm>
  );

  return (
    <EuiModal
      onClose={onClose}
      initialFocus='[name=popswitch]'
      onClick={ev => {
        ev.stopPropagation();
      }}
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>Edit agent groups</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>{form}</EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
        <EuiButton
          onClick={onClose}
          fill
          isLoading={isConfirmLoading}
          disabled={isGroupsLoading || !selectedGroups?.length}
        >
          Save
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
});
