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
import { Agent, IAgentResponse } from '../../../../../../common/types';
import { getAgentManagement } from '../../../../../plugin-services';
import { EditAgentsGroupsModalResult } from './result';

export enum RESULT_TYPE {
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface GroupResult {
  documentId: string;
  result: RESULT_TYPE;
  successAgents?: string[];
  errorMessage?: string;
  totalErrorAgents?: number;
  errorAgents?: [
    {
      error: { message: string };
      id: string;
    },
  ];
}

interface EditAgentsGroupsModalProps {
  selectedAgents: Agent[];
  allAgentsSelected: boolean;
  params: object;
  onClose: () => void;
  reloadAgents: () => void;
  addOrRemove: 'add' | 'remove';
}

interface Option {
  label: string;
}

export const EditAgentsGroupsModal = ({
  selectedAgents,
  allAgentsSelected,
  params,
  onClose,
  reloadAgents,
  addOrRemove,
}: EditAgentsGroupsModalProps) => {
  const [selectedGroups, setSelectedGroups] = useState<Option[]>([]);
  const [finalAgents, setFinalAgents] = useState<IAgentResponse[]>([]);
  const [getAgentsStatus, setGetAgentsStatus] = useState('disabled');
  const [getAgentsError, setGetAgentsError] = useState();
  const [saveChangesStatus, setSaveChangesStatus] = useState('disabled');
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [documentResults, setDocumentResults] = useState<GroupResult[]>([]);

  const getAgents = async () => {
    try {
      const { hits: results }: { hits: IAgentResponse } =
        await getAgentManagement().getAll(params);

      return results;
    } catch (error) {
      setGetAgentsStatus('danger');
      setGetAgentsError(error);
    }
  };

  const getArrayByProperty = (array: any[], propertyName: string) =>
    array.map(element => element[propertyName]);

  const handleOnSave = async () => {
    setIsResultVisible(true);
    setGetAgentsStatus('loading');

    let agents = selectedAgents;

    if (allAgentsSelected) {
      agents = await getAgents();
    }

    if (!agents?.length) {
      return;
    }

    setGetAgentsStatus('complete');

    setFinalAgents(agents);
    setSaveChangesStatus('loading');

    const groups = getArrayByProperty(selectedGroups, 'label');
    const agentDocumentIds = getArrayByProperty(agents, '_id');
    const promises = agentDocumentIds.map(documentId => {
      const promise =
        addOrRemove === 'add'
          ? getAgentManagement().addGroups(documentId, groups)
          : getAgentManagement().removeGroups(documentId, groups);

      return promise
        .then(result => {
          if (!result) {
            return;
          }

          const { data, error, message } = result;
          const {
            affected_items: affectedItems,
            failed_items: failedItems,
            total_failed_items: totalFailedItems,
          } = data;

          setDocumentResults(results => {
            const newGroupResult = {
              documentId,
              result: error ? RESULT_TYPE.ERROR : RESULT_TYPE.SUCCESS,
              successAgents: affectedItems,
              errorAgents: failedItems,
              errorMessage: message,
              totalErrorAgents: totalFailedItems,
            };

            return [...results, newGroupResult];
          });
        })
        .catch(error => {
          setDocumentResults(results => {
            const newResult: GroupResult = {
              documentId,
              result: RESULT_TYPE.ERROR,
              errorMessage: error.message,
              errorAgents: {
                error: { message: error.message },
                groups: groups,
              },
            };

            return [...results, newResult];
          });
        });
    });

    try {
      await Promise.allSettled(promises);
      setSaveChangesStatus('complete');
    } catch {
      setSaveChangesStatus('danger');
    } finally {
      reloadAgents();
    }
  };

  const groupsText =
    addOrRemove === 'add' ? 'Select groups to add' : 'Select groups to remove';

  const handleOnChangeGroupsSelect = (selectedGroups: Option[]) => {
    setSelectedGroups(selectedGroups);
  };

  const onCreateOption = (searchValue: string) => {
    const newOption = {
      label: searchValue,
    };

    // Select the option.
    setSelectedGroups([...selectedGroups, newOption]);
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
          selectedOptions={selectedGroups}
          onChange={handleOnChangeGroupsSelect}
          isLoading={false}
          // TODO: Change when the endpoint or index pattern is available to request the groups
          // options={groups?.map(group => ({ label: group })) || []}
          noSuggestions
          onCreateOption={onCreateOption}
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
        {isResultVisible ? (
          <EditAgentsGroupsModalResult
            finalAgents={finalAgents}
            addOrRemove={addOrRemove}
            getAgentsStatus={getAgentsStatus}
            getAgentsError={getAgentsError}
            saveChangesStatus={saveChangesStatus}
            documentResults={documentResults}
            groups={getArrayByProperty(selectedGroups, 'label')}
          />
        ) : (
          selectGroupsForm
        )}
      </EuiModalBody>
      <EuiModalFooter>
        {isResultVisible ? (
          <EuiButton
            onClick={onClose}
            fill
            disabled={
              getAgentsStatus === 'loading' || saveChangesStatus === 'loading'
            }
          >
            Close
          </EuiButton>
        ) : (
          <>
            <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
            <EuiButton
              onClick={handleOnSave}
              fill
              disabled={!selectedGroups?.length}
            >
              Save
            </EuiButton>
          </>
        )}
      </EuiModalFooter>
    </EuiModal>
  );
};
