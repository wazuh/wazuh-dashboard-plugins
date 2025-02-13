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
import { Agent } from '../../../../../../common/types';
import { EditAgentsGroupsModalResult } from './result';

export enum RESULT_TYPE {
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface GroupResult {
  group: string;
  result: RESULT_TYPE;
  successAgents?: string[];
  errorMessage?: string;
  totalErrorAgents?: number;
  errorAgents?: [];
}

interface EditAgentsGroupsModalProps {
  selectedAgents: Agent[];
  // allAgentsSelected: boolean;
  // filters: any;
  onClose: () => void;
  reloadAgents: () => void;
  addOrRemove: 'add' | 'remove';
}

interface Option {
  label: string;
}

export const EditAgentsGroupsModal = ({
  selectedAgents,
  // allAgentsSelected,
  // filters,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [groupResults, setGroupResults] = useState<GroupResult[]>([]);

  const getAgents = async () => {
    try {
      setGetAgentsStatus('complete');
    } catch (error) {
      setGetAgentsStatus('danger');
      setGetAgentsError(error);
    }
  };

  const getArrayByProperty = (array: any[], propertyName: string) =>
    array.map(element => element[propertyName]);

  const handleOnSave = async () => {
    setGetAgentsStatus('loading');
    setIsResultVisible(true);

    const agents = await getAgents();

    if (!agents?.length) {
      return;
    }

    setFinalAgents(agents);
    setSaveChangesStatus('loading');

    try {
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

  const selectGroupsForm = (
    <EuiForm component='form'>
      {/* {true ? (
        <EuiFormRow>
          <EuiCallOut
            color='warning'
            iconType='alert'
            title='The changes will be applied to all agents that match the filters set in the list'
          />
        </EuiFormRow>
      ) : ( */}
      <EuiFormRow label='Selected agents'>
        <EuiText>{selectedAgents.length}</EuiText>
      </EuiFormRow>
      {/* )} */}

      <EuiFormRow label={groupsText}>
        <EuiComboBox
          placeholder={groupsText}
          options={[]}
          selectedOptions={selectedGroups}
          onChange={handleOnChangeGroupsSelect}
          isLoading={false}
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
        {isResultVisible ? (
          <EditAgentsGroupsModalResult
            finalAgents={finalAgents}
            addOrRemove={addOrRemove}
            getAgentsStatus={getAgentsStatus}
            getAgentsError={getAgentsError}
            saveChangesStatus={saveChangesStatus}
            groupResults={groupResults}
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
