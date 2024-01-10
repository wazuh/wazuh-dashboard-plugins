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
import { withErrorBoundary, withReduxProvider } from '../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { useGetGroups } from '../../hooks';
import {
  addAgentToGroupService,
  removeAgentFromGroupService,
} from '../../services';
import { Agent } from '../../types';
import {
  AgentsGlobalActionsResultModal,
  RESULT_TYPE,
  Result,
} from './result-modal';

interface EditAgentsGroupsModalProps {
  agents: Agent[];
  onClose: () => void;
  reloadAgents: () => void;
  addOrRemove: 'add' | 'remove';
}

type Option = {
  label: string;
};

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
    const [selectedGroups, setSelectedGroups] = useState<Option[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isResultModalVisible, setIsResultModalVisible] = useState(false);
    const [results, setResults] = useState<Result[]>([]);

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
          error: errorGroups,
          message: errorGroups.message || errorGroups,
          title: `Could not get groups`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }

    const getStringArrayGroups = (options: Option[]) => {
      return options.map(group => group.label);
    };

    const handleOnChange = (selectedGroups: Option[]) => {
      setSelectedGroups(selectedGroups);
    };

    const handleOnSave = async () => {
      setIsSaving(true);

      try {
        const promises = agents.reduce((acc, agent) => {
          const groups = getStringArrayGroups(selectedGroups);

          if (addOrRemove === 'add') {
            const groupsToAdd = groups.filter(
              group => !agent.group?.includes(group),
            );

            const groupsToAddPromises = groupsToAdd?.map(group =>
              addAgentToGroupService(agent.id, group)
                .then(() =>
                  setResults(results => {
                    const newResult = {
                      type: RESULT_TYPE.SUCCESS,
                      agent,
                      group,
                    };
                    return [...results, newResult];
                  }),
                )
                .catch(error => {
                  setResults(results => {
                    const newResult = {
                      type: RESULT_TYPE.ERROR,
                      agent,
                      group,
                      message: error.message,
                    };
                    return [...results, newResult];
                  });
                }),
            );

            return [...acc, ...groupsToAddPromises];
          }

          const groupsToRemove = groups.filter(group =>
            agent.group?.includes(group),
          );

          const groupsToRemovePromises = groupsToRemove?.map(group =>
            removeAgentFromGroupService(agent.id, group)
              .then(() =>
                setResults(results => {
                  const newResult = {
                    type: RESULT_TYPE.SUCCESS,
                    agent,
                    group,
                  };
                  return [...results, newResult];
                }),
              )
              .catch(error => {
                setResults(results => {
                  const newResult = {
                    type: RESULT_TYPE.ERROR,
                    agent,
                    group,
                    message: error.message,
                  };
                  return [...results, newResult];
                });
              }),
          );

          return [...acc, ...groupsToRemovePromises];
        }, [] as any);

        await Promise.allSettled(promises);

        setIsSaving(false);
        setIsResultModalVisible(true);

        reloadAgents();
      } catch (error) {
        setIsSaving(false);
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
      }
    };

    const groupsText =
      addOrRemove === 'add'
        ? 'Select groups to add'
        : 'Select groups to remove';

    const form = (
      <EuiForm component='form'>
        <EuiFormRow label='Seleted agents'>
          <EuiText>{agents.length}</EuiText>
        </EuiFormRow>
        <EuiFormRow label={groupsText}>
          <EuiComboBox
            placeholder={groupsText}
            options={groups?.map(group => ({ label: group })) || []}
            selectedOptions={selectedGroups}
            onChange={handleOnChange}
            isLoading={isGroupsLoading}
            clearOnBlur
          />
        </EuiFormRow>
      </EuiForm>
    );

    return (
      <EuiModal onClose={onClose}>
        {isResultModalVisible ? (
          <AgentsGlobalActionsResultModal
            title={
              addOrRemove === 'add'
                ? 'Add groups to agents'
                : 'Remove groups from agents'
            }
            isLoading={isSaving}
            results={results}
            onClose={onClose}
            loadingMessage='Adding groups to agents...'
          />
        ) : (
          <>
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
          </>
        )}
      </EuiModal>
    );
  },
);
