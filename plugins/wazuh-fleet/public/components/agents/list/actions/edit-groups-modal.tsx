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
  EuiFlexGroup,
  EuiFlexItem,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';
import { getAgentManagement } from '../../../../plugin-services';
import { Agent } from '../../../../../common/types';

interface EditAgentGroupsModalProps {
  agent: Agent;
  onClose: () => void;
  reloadAgents: () => void;
}

export const EditAgentGroupsModal = ({
  agent,
  onClose,
  reloadAgents,
}: EditAgentGroupsModalProps) => {
  const [selectedGroups, setSelectedGroups] = useState(
    agent.agent.groups?.map(group => ({ label: group })) || [],
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleOnSave = async () => {
    try {
      setIsSaving(true);
      await getAgentManagement().editGroup(
        agent.agent.id,
        selectedGroups.map(group => group.label),
      );
      setIsSaving(false);
      reloadAgents();
      onClose();
    } catch {
      setIsSaving(false);
    }
  };

  const onCreateOption = (searchValue: string) => {
    const newOption = {
      label: searchValue,
    };

    // Select the option.
    setSelectedGroups([...selectedGroups, newOption]);
  };

  const form = (
    <EuiForm component='form'>
      <EuiFlexGroup direction='column' gutterSize='m'>
        <EuiFlexItem>
          <EuiFlexGroup gutterSize='m'>
            <EuiFlexItem>
              <EuiDescriptionList compressed>
                <EuiDescriptionListTitle>Agent ID</EuiDescriptionListTitle>
                <EuiDescriptionListDescription>
                  {agent.agent.id}
                </EuiDescriptionListDescription>
              </EuiDescriptionList>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiDescriptionList compressed>
                <EuiDescriptionListTitle>Agent name</EuiDescriptionListTitle>
                <EuiDescriptionListDescription>
                  {agent.agent.name}
                </EuiDescriptionListDescription>
              </EuiDescriptionList>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow
            label='Groups'
            isInvalid={!selectedGroups?.length}
            error={['You must add at least one group']}
          >
            <EuiComboBox
              placeholder='Select groups'
              options={[]}
              selectedOptions={selectedGroups}
              onChange={selectedGroups => setSelectedGroups(selectedGroups)}
              isLoading={false}
              clearOnBlur
              // TODO: Change when the endpoint or index pattern is available to request the groups
              // options={groups?.map(group => ({ label: group })) || []}
              noSuggestions
              onCreateOption={onCreateOption}
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiForm>
  );

  return (
    <EuiModal
      onClose={onClose}
      onClick={event => {
        event.stopPropagation();
      }}
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>Edit agent groups</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>{form}</EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
        <EuiButton onClick={handleOnSave} fill isLoading={isSaving}>
          Save
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
