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
import { IAgentResponse } from '../../../../../../common/types';
import { getAgentManagement } from '../../../../../plugin-services';
import { EditAgentsGroupsModalResult } from './result';
import { EditActionGroups } from './types';

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
  selectedAgents: IAgentResponse[];
  allAgentsSelected: boolean;
  params: object;
  onClose: () => void;
  reloadAgents: () => void;
  editAction: EditActionGroups;
}

interface Option {
  label: string;
}

export const EditAgentsGroupsModal = ({
  selectedAgents,
  allAgentsSelected,
  onClose,
  reloadAgents,
  editAction,
}: EditAgentsGroupsModalProps) => {
  const [selectedGroups, setSelectedGroups] = useState<Option[]>([]);
  const [finalAgents, setFinalAgents] = useState<IAgentResponse[]>([]);
  const [getAgentsStatus, setGetAgentsStatus] = useState('disabled');
  const [getAgentsError, _setGetAgentsError] = useState();
  const [saveChangesStatus, setSaveChangesStatus] = useState('disabled');
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [documentResults, setDocumentResults] = useState<GroupResult[]>([]);
  const getArrayByProperty = (array: any[], propertyName: string) =>
    array.map(element => element[propertyName]);

  const handleSave = async () => {
    setIsResultVisible(true);
    setGetAgentsStatus('loading');
    setGetAgentsStatus('complete');
    setFinalAgents(selectedAgents);
    setSaveChangesStatus('loading');

    const groups = getArrayByProperty(selectedGroups, 'label');
    const agentDocumentIds = getArrayByProperty(selectedAgents, '_id');

    // Process each agent
    const processAgent = async (documentId: string) => {
      try {
        // Determine which action to perform
        const actionMethod =
          editAction === EditActionGroups.ADD
            ? getAgentManagement().addGroups
            : getAgentManagement().removeGroups;
        const result = await actionMethod(documentId, groups);

        if (!result) {
          return;
        }

        const { data, error, message } = result;
        const {
          affected_items: affectedItems,
          failed_items: failedItems,
          total_failed_items: totalFailedItems,
        } = data;

        // Update results
        setDocumentResults(results => [
          ...results,
          {
            documentId,
            result: error ? RESULT_TYPE.ERROR : RESULT_TYPE.SUCCESS,
            successAgents: affectedItems,
            errorAgents: failedItems,
            errorMessage: message,
            totalErrorAgents: totalFailedItems,
          },
        ]);
      } catch (error: any) {
        setDocumentResults(results => [
          ...results,
          {
            documentId,
            result: RESULT_TYPE.ERROR,
            errorMessage: error.message,
            errorAgents: [
              {
                error: { message: error.message },
                id: documentId,
              },
            ],
          },
        ]);
      }
    };

    try {
      await Promise.allSettled(
        agentDocumentIds.map(element => processAgent(element)),
      );
      setSaveChangesStatus('complete');
    } catch {
      setSaveChangesStatus('danger');
    } finally {
      reloadAgents();
    }
  };

  const groupsText =
    editAction === EditActionGroups.ADD
      ? 'Select groups to add'
      : 'Select groups to remove';

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
          {editAction === EditActionGroups.ADD
            ? 'Add groups to agents'
            : 'Remove groups from agents'}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        {isResultVisible ? (
          <EditAgentsGroupsModalResult
            finalAgents={finalAgents}
            editAction={editAction}
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
              onClick={handleSave}
              fill
              disabled={selectedGroups?.length === 0}
            >
              Save
            </EuiButton>
          </>
        )}
      </EuiModalFooter>
    </EuiModal>
  );
};
