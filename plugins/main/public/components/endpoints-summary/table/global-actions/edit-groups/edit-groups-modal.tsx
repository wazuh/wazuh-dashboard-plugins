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
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiLoadingSpinner,
  EuiIcon,
  EuiCallOut,
  EuiSteps,
  EuiAccordion,
  EuiPanel,
} from '@elastic/eui';
import { compose } from 'redux';
import { withErrorBoundary, withReduxProvider } from '../../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import { useGetGroups } from '../../../hooks';
import {
  addAgentToGroupService,
  addAgentsToGroupService,
  getAgentsService,
  removeAgentFromGroupService,
  removeAgentsFromGroupService,
} from '../../../services';
import { Agent } from '../../../types';
import { RESULT_TYPE, Result } from './result-modal';

interface EditAgentsGroupsModalProps {
  selectedAgents: Agent[];
  allAgentsSelected: boolean;
  allAgentsCount: number;
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
    allAgentsCount,
    filters,
    onClose,
    reloadAgents,
    addOrRemove,
  }: EditAgentsGroupsModalProps) => {
    const [selectedGroups, setSelectedGroups] = useState<Option[]>([]);
    const [finalAgents, setFinalAgents] = useState<Agent[]>([]);
    const [getAgentsStatus, setGetAgentsStatus] = useState('disabled');
    const [saveChangesStatus, setSaveChangesStatus] = useState('disabled');
    const [isResultVisible, setIsResultVisible] = useState(false);
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

    const getAgents = async () => {
      if (!allAgentsSelected) {
        setGetAgentsStatus('complete');
        return selectedAgents;
      }
      try {
        const { affected_items } = await getAgentsService(filters.q, 0);
        setGetAgentsStatus('complete');
        return affected_items;
      } catch (error) {
        setGetAgentsStatus('danger');

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
          .then(() =>
            setResults(results => {
              const newResult = {
                type: RESULT_TYPE.SUCCESS,
                group,
              };
              return [...results, newResult];
            }),
          )
          .catch(error => {
            setResults(results => {
              const newResult = {
                type: RESULT_TYPE.ERROR,
                group,
                message: error.message,
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
              title='The changes will be applied to the agents that match the filters set in the list'
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
              getAgentsStatus === 'loading' ? (
                <EuiLoadingSpinner />
              ) : getAgentsStatus === 'complete' ? (
                <EuiAccordion
                  id='agentsAccordion'
                  buttonContent={`${finalAgents.length} agents`}
                >
                  <EuiText>Agents detail</EuiText>
                </EuiAccordion>
              ) : (
                <EuiPanel color='danger'>
                  <EuiAccordion
                    id='agentsErrorAccordion'
                    buttonContent='Could not get agents data'
                  >
                    <EuiText>Agents detail</EuiText>
                  </EuiAccordion>
                </EuiPanel>
              ),
          },
          {
            step: 2,
            title: addOrRemove === 'add' ? 'Add groups' : 'Remove groups',
            status: saveChangesStatus,
            children: <EuiText>{`${finalAgents.length} agents`}</EuiText>,
          },
        ]}
      />
      // <EuiDescriptionList textStyle='reverse' align='center' type='column'>
      //   <EuiDescriptionListTitle>
      //     Retrieve agents{!isLoadingAgents ? `(${finalAgents.length})` : ''}
      //   </EuiDescriptionListTitle>
      //   <EuiDescriptionListDescription>
      //     {isLoadingAgents ? (
      //       <EuiLoadingSpinner />
      //     ) : (
      //       <EuiIcon type='check' color='success' />
      //     )}
      //   </EuiDescriptionListDescription>
      //   <EuiDescriptionListTitle>Apply changes</EuiDescriptionListTitle>
      //   <EuiDescriptionListDescription>
      //     {isApplyingChanges ? (
      //       <EuiLoadingSpinner />
      //     ) : (
      //       <EuiIcon type='check' color='success' />
      //     )}
      //   </EuiDescriptionListDescription>
      // </EuiDescriptionList>
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
