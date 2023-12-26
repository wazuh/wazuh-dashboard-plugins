import React, { useState, useEffect } from 'react';
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
import {
  addAgentToGroupService,
  removeAgentFromGroupsService,
} from '../services';

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
  const [isSaving, setIsSaving] = useState(false);

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

  const handleOnSave = async () => {
    setIsSaving(true);

    const flatSelectedGroups = selectedGroups.map(group => group.label);
    const addedGroups =
      flatSelectedGroups.filter(group => !agent.group?.includes(group)) || [];
    const removedGroups =
      agent.group?.filter(group => !flatSelectedGroups.includes(group)) || [];

    if (!removedGroups.length && !addedGroups.length) {
      setIsSaving(false);
      onClose();
      return;
    }

    try {
      addedGroups.length &&
        (await Promise.all(
          addedGroups?.map(group => addAgentToGroupService(agent.id, group)),
        ));
      removedGroups.length &&
        (await removeAgentFromGroupsService(agent.id, removedGroups));
      reloadAgents();
    } catch (error) {
      const options = {
        context: `EditAgentGroupsModal.handleOnSave`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error,
          message: error.message || error,
          title: `Could not save agent groups`,
        },
      };
      getErrorOrchestrator().handleError(options);
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  const form = (
    <EuiForm component='form'>
      <EuiFormRow label='Agent'>
        <EuiText>
          <b>{agent.name}</b>
        </EuiText>
      </EuiFormRow>
      <EuiFormRow
        label='Groups'
        isRequired
        isInvalid={!selectedGroups?.length}
        error={['You must add at least one group']}
      >
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
          onClick={handleOnSave}
          fill
          isLoading={isSaving}
          disabled={isGroupsLoading || !selectedGroups?.length}
        >
          Save
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
});
