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
  EuiCallOut,
} from '@elastic/eui';
import { compose } from 'redux';
import { withErrorBoundary } from '../../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import { useGetGroups } from '../../../hooks';
import {
  addAgentsToGroupService,
  getAgentsService,
  removeAgentsFromGroupService,
} from '../../../services';
import { Agent } from '../../../types';
import { EditAgentsGroupsModalResult } from './result';
import { ErrorAgent } from '../../../services/paginated-agents-group';

export enum RESULT_TYPE {
  SUCCESS = 'success',
  ERROR = 'error',
}

export type GroupResult = {
  group: string;
  result: RESULT_TYPE;
  successAgents?: string[];
  errorMessage?: string;
  totalErrorAgents?: number;
  errorAgents?: ErrorAgent[];
};

interface EditAgentsGroupsModalProps {
  selectedAgents: Agent[];
  allAgentsSelected: boolean;
  filters: any;
  onClose: () => void;
  reloadAgents: () => void;
  addOrRemove: 'add' | 'remove';
}

type Option = {
  label: string;
};

export const EditAgentsGroupsModal = compose(withErrorBoundary)(
  ({
    selectedAgents,
    allAgentsSelected,
    filters,
    onClose,
    reloadAgents,
    addOrRemove,
  }: EditAgentsGroupsModalProps) => {
    const [selectedGroups, setSelectedGroups] = useState<Option[]>([]);
    const [finalAgents, setFinalAgents] = useState<Agent[]>([]);
    const [getAgentsStatus, setGetAgentsStatus] = useState('disabled');
    const [getAgentsError, setGetAgentsError] = useState();
    const [saveChangesStatus, setSaveChangesStatus] = useState('disabled');
    const [isResultVisible, setIsResultVisible] = useState(false);
    const [groupResults, setGroupResults] = useState<GroupResult[]>([]);

    const {
      groups,
      isLoading: isGroupsLoading,
      error: errorGetGroups,
    } = useGetGroups();

    if (errorGetGroups) {
      const options = {
        context: `EditAgentsGroupsModal.useGetGroups`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: errorGetGroups,
          message: errorGetGroups.message || errorGetGroups,
          title: `Could not get groups`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }

    const getAgents = async () => {
      if (!allAgentsSelected) {
        setGetAgentsStatus('complete');
        return selectedAgents;
      }
      try {
        const { affected_items } = await getAgentsService({ filters });
        setGetAgentsStatus('complete');
        return affected_items;
      } catch (error) {
        setGetAgentsStatus('danger');
        setGetAgentsError(error);

        const options = {
          context: `EditAgentsGroupsModal.handleOnSave`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: error.message || error,
            title: `Could not get agents data`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    };

    const getArrayByProperty = (array: any[], propertyName: string) => {
      return array.map(element => element[propertyName]);
    };

    const handleOnSave = async () => {
      setGetAgentsStatus('loading');
      setIsResultVisible(true);

      const agents = await getAgents();

      if (!agents?.length) {
        return;
      }

      setFinalAgents(agents);

      setSaveChangesStatus('loading');

      const agentIds = getArrayByProperty(agents, 'id');

      const groups = getArrayByProperty(selectedGroups, 'label');

      const promises = groups.map(group => {
        const promise =
          addOrRemove === 'add'
            ? addAgentsToGroupService({ agentIds, groupId: group })
            : removeAgentsFromGroupService({ agentIds, groupId: group });
        return promise
          .then(result => {
            const { data, error, message } = result.data;
            const { affected_items, failed_items, total_failed_items } = data;
            setGroupResults(results => {
              const newGroupResult = {
                group,
                result: error ? RESULT_TYPE.ERROR : RESULT_TYPE.SUCCESS,
                successAgents: affected_items,
                errorAgents: failed_items,
                errorMessage: message,
                totalErrorAgents: total_failed_items,
              };
              return [...results, newGroupResult];
            });
          })
          .catch(error => {
            setGroupResults(results => {
              const newResult: GroupResult = {
                group,
                result: RESULT_TYPE.ERROR,
                errorMessage: error.message,
                errorAgents: [
                  {
                    error: { message: error.message },
                    id: agentIds,
                  },
                ],
              };
              return [...results, newResult];
            });
            const options = {
              context: `EditAgentsGroupsModal.handleOnSave`,
              level: UI_LOGGER_LEVELS.ERROR,
              severity: UI_ERROR_SEVERITIES.BUSINESS,
              store: true,
              error: {
                error,
                message: error.message || error,
                title:
                  addOrRemove === 'add'
                    ? `Could not add agents to group`
                    : `Could not remove agents from group`,
              },
            };
            getErrorOrchestrator().handleError(options);
          });
      });

      try {
        await Promise.allSettled(promises);
        setSaveChangesStatus('complete');
      } catch (error) {
        setSaveChangesStatus('danger');
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
        reloadAgents();
      }
    };

    const groupsText =
      addOrRemove === 'add'
        ? 'Select groups to add'
        : 'Select groups to remove';

    const handleOnChangeGroupsSelect = (selectedGroups: Option[]) => {
      setSelectedGroups(selectedGroups);
    };

    const selectGroupsForm = (
      <EuiForm component='form'>
        {allAgentsSelected ? (
          <EuiFormRow>
            <EuiCallOut
              color='warning'
              iconType='alert'
              title='The changes will be applied to all agents that match the filters set in the list'
            />
          </EuiFormRow>
        ) : (
          <EuiFormRow label='Selected agents'>
            <EuiText>{selectedAgents.length}</EuiText>
          </EuiFormRow>
        )}

        <EuiFormRow label={groupsText}>
          <EuiComboBox
            placeholder={groupsText}
            options={groups?.map(group => ({ label: group })) || []}
            selectedOptions={selectedGroups}
            onChange={handleOnChangeGroupsSelect}
            isLoading={isGroupsLoading}
            clearOnBlur
          />
        </EuiFormRow>
      </EuiForm>
    );

    return (
      <EuiModal onClose={onClose}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            {addOrRemove === 'add'
              ? 'Add groups to agents'
              : 'Remove groups from agents'}
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          {!isResultVisible ? (
            selectGroupsForm
          ) : (
            <EditAgentsGroupsModalResult
              finalAgents={finalAgents}
              addOrRemove={addOrRemove}
              getAgentsStatus={getAgentsStatus}
              getAgentsError={getAgentsError}
              saveChangesStatus={saveChangesStatus}
              groupResults={groupResults}
              groups={getArrayByProperty(selectedGroups, 'label')}
            />
          )}
        </EuiModalBody>
        <EuiModalFooter>
          {!isResultVisible ? (
            <>
              <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
              <EuiButton
                onClick={handleOnSave}
                fill
                disabled={isGroupsLoading || !selectedGroups?.length}
              >
                Save
              </EuiButton>
            </>
          ) : (
            <EuiButton
              onClick={onClose}
              fill
              disabled={
                getAgentsStatus === 'loading' || saveChangesStatus === 'loading'
              }
            >
              Close
            </EuiButton>
          )}
        </EuiModalFooter>
      </EuiModal>
    );
  },
);
