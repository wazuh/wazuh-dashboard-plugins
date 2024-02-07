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
  EuiLoadingSpinner,
  EuiCallOut,
  EuiSteps,
  EuiAccordion,
  EuiPanel,
  EuiInMemoryTable,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { compose } from 'redux';
import { withErrorBoundary, withReduxProvider } from '../../../../common/hocs';
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

enum RESULT_TYPE {
  SUCCESS = 'success',
  ERROR = 'error',
}

type GroupResult = {
  group: string;
  result: RESULT_TYPE;
  message?: string;
  agentIds?: string;
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

export const EditAgentsGroupsModal = compose(
  withErrorBoundary,
  withReduxProvider,
)(
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
        let offset = 0;
        const limit = 1000;
        let allAffectedItems: Agent[] = [];
        let totalAffectedItems;

        do {
          const { affected_items, total_affected_items } =
            await getAgentsService(filters.q, limit, offset);

          if (totalAffectedItems === undefined) {
            totalAffectedItems = total_affected_items;
          }

          allAffectedItems = allAffectedItems.concat(affected_items);

          offset += limit;
        } while (offset < totalAffectedItems);

        setGetAgentsStatus('complete');
        return allAffectedItems;
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

      const agentsIds = getArrayByProperty(agents, 'id');

      const groups = getArrayByProperty(selectedGroups, 'label');

      const promises = groups.map(group => {
        const promise =
          addOrRemove === 'add'
            ? addAgentsToGroupService(agentsIds, group)
            : removeAgentsFromGroupService(agentsIds, group);
        return promise
          .then(result => {
            setGroupResults(results => {
              const newGroupResult = {
                group,
                result: RESULT_TYPE.SUCCESS,
                agents: result.data.data.affected_items.map(
                  item => finalAgents.find(agent => agent.id === item) as Agent,
                ),
              };
              return [...results, newGroupResult];
            });
          })
          .catch((error: { message: string }) => {
            setGroupResults(results => {
              const match = error.message.match(/Affected ids: (.+)$/);
              console.log(error.message, match);
              const errorAgentIds = match ? match[1] : '';

              const newResult = {
                group,
                result: RESULT_TYPE.ERROR,
                message: error.message,
                agentIds: errorAgentIds,
              };
              return [...results, newResult];
            });
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

    const result = (
      <EuiSteps
        steps={[
          {
            step: 1,
            title: 'Retrieve agents data',
            status: getAgentsStatus,
            children:
              getAgentsStatus === 'loading' ? null : getAgentsStatus ===
                'complete' ? (
                <EuiAccordion
                  id='agentsAccordion'
                  buttonContent={`Agents details (${finalAgents.length})`}
                >
                  <EuiInMemoryTable
                    items={finalAgents}
                    tableLayout='auto'
                    columns={[
                      {
                        field: 'id',
                        name: 'ID',
                        align: 'left',
                        sortable: true,
                        truncateText: true,
                      },
                      {
                        field: 'name',
                        name: 'Name',
                        align: 'left',
                        sortable: true,
                        truncateText: true,
                      },
                    ]}
                    pagination={true}
                    sorting={{
                      sort: {
                        field: 'id',
                        direction: 'asc',
                      },
                    }}
                  />
                </EuiAccordion>
              ) : (
                <EuiCallOut
                  color='danger'
                  iconType='alert'
                  title='Could not get agents data'
                >
                  <EuiText>{getAgentsError?.message}</EuiText>
                </EuiCallOut>
              ),
          },
          {
            step: 2,
            title: addOrRemove === 'add' ? 'Add groups' : 'Remove groups',
            status: saveChangesStatus,
            children: (
              <EuiFlexGroup direction='column'>
                {groupResults.map(groupResult => (
                  <EuiFlexItem key={groupResult.group}>
                    {groupResult.result === RESULT_TYPE.ERROR ? (
                      <EuiCallOut
                        color='danger'
                        iconType='alert'
                        title={`Group "${groupResult.group}": ${groupResult.message}`}
                      >
                        <EuiText>{`Agents: ${groupResult.agentIds}`}</EuiText>
                      </EuiCallOut>
                    ) : (
                      <EuiText>{groupResult.group}</EuiText>
                    )}
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            ),
          },
        ]}
      />
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
          {!isResultVisible ? selectGroupsForm : result}
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
