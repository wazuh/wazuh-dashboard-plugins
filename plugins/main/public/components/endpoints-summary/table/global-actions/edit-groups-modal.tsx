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
} from '@elastic/eui';
import { compose } from 'redux';
import { withErrorBoundary, withReduxProvider } from '../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { useGetGroups } from '../../hooks';
import {
  addAgentToGroupService,
  removeAgentFromGroupsService,
} from '../../services';
import { Agent } from '../../types';
import { getToasts } from '../../../../kibana-services';

interface EditAgentsGroupsModalProps {
  agents: Agent[];
  onClose: () => void;
  reloadAgents: () => void;
  addOrRemove: 'add' | 'remove';
}

export const EditAgentsGroupsModal = compose(
  withErrorBoundary,
  withReduxProvider,
)(
  ({
    agents,
    onClose,
    reloadAgents,
    addOrRemove,
  }: EditAgentsGroupsModalProps) => {
    const [selectedGroups, setSelectedGroups] = useState<{ label: string }[]>(
      [],
    );
    const [isSaving, setIsSaving] = useState(false);

    const {
      groups,
      isLoading: isGroupsLoading,
      error: errorGroups,
    } = useGetGroups();

    if (errorGroups) {
      const options = {
        context: `EditAgentsGroupsModal.useGetGroups`,
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

    const showToast = (
      color: string,
      title: string = '',
      text: string = '',
      time: number = 3000,
    ) => {
      getToasts().add({
        color: color,
        title: title,
        text: text,
        toastLifeTimeMs: time,
      });
    };

    //Only allow remove groups from an agent if the agent at least keep one group
    const allowRemoveGroupsFromAgents = (
      agentGroups: string[],
      groupsToRemove: string[],
    ) => {
      const finalAgentGroups = agentGroups.filter(group =>
        groupsToRemove.includes(group),
      );
      return finalAgentGroups.length > 0;
    };

    const handleOnSave = async () => {
      setIsSaving(true);

      try {
        const promises = agents.map(agent => {
          if (addOrRemove === 'add') {
            return selectedGroups?.map(group =>
              addAgentToGroupService(agent.id, group.label),
            );
          }

          const groups = selectedGroups.map(group => group.label);

          if (allowRemoveGroupsFromAgents(agent.group, groups)) {
            return removeAgentFromGroupsService(agent.id, groups);
          }

          return [];
        });
        await Promise.all(promises);
        showToast(
          'success',
          addOrRemove === 'add'
            ? 'Add groups to agents'
            : 'Remove groups from agents',
          'Groups saved successfully',
        );
        reloadAgents();
      } catch (error) {
        const options = {
          context: `EditAgentsGroupsModal.handleOnSave`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: error.message || error,
            title: `Could not save agents groups`,
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
        <EuiFormRow label='Groups' isRequired>
          <EuiComboBox
            placeholder={
              addOrRemove === 'add'
                ? 'Select groups to add'
                : 'Select groups to remove'
            }
            options={groups?.map(group => ({ label: group })) || []}
            selectedOptions={selectedGroups}
            onChange={selectedGroups => setSelectedGroups(selectedGroups)}
            isLoading={isGroupsLoading}
            clearOnBlur
          />
        </EuiFormRow>
      </EuiForm>
    );

    return (
      <EuiModal
        onClose={onClose}
        onClick={ev => {
          ev.stopPropagation();
        }}
      >
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            {addOrRemove === 'add'
              ? 'Add groups to agents'
              : 'Remove groups from agents'}
          </EuiModalHeaderTitle>
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
  },
);
