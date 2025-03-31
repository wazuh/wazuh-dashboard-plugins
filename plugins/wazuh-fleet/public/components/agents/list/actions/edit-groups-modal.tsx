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
import { getAgentManagement, getToasts } from '../../../../plugin-services';
import { IAgentResponse } from '../../../../../common/types';

interface EditAgentGroupsModalProps {
  agent: IAgentResponse;
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

  // Check if selected groups are the same as agent's current groups
  const areGroupsUnchanged = () => {
    const currentGroups = agent.agent.groups || [];
    const selectedGroupLabels = selectedGroups.map(group => group.label);

    if (currentGroups.length !== selectedGroupLabels.length) {
      return false;
    }

    // Check if all current groups are in selected groups and vice versa
    return (
      currentGroups.every(group => selectedGroupLabels.includes(group)) &&
      selectedGroupLabels.every(group => currentGroups.includes(group))
    );
  };

  const handleSave = async () => {
    const flatSelectedGroups = selectedGroups.map(group => group.label);
    const addedGroups =
      flatSelectedGroups.filter(
        group => !agent.agent.groups?.includes(group),
      ) || [];
    const removedGroups =
      agent.agent.groups?.filter(
        group => !flatSelectedGroups.includes(group),
      ) || [];

    // Exit early if no changes
    if (removedGroups.length === 0 && addedGroups.length === 0) {
      setIsSaving(false);
      onClose();

      return;
    }

    try {
      setIsSaving(true);

      // Perform group operations in parallel if needed
      const operations = [];

      if (addedGroups.length > 0) {
        operations.push(
          getAgentManagement().addGroups(agent.agent.id, addedGroups),
        );
      }

      if (removedGroups.length > 0) {
        operations.push(
          getAgentManagement().removeGroups({
            agentId: agent.agent.id,
            groupIds: removedGroups,
          }),
        );
      }

      await Promise.all(operations);

      getToasts().addInfo({
        title: 'Agent groups edited',
        text: `Agent ${agent.agent.name} groups have been updated`,
      });
      setIsSaving(false);
      reloadAgents();
      onClose();
    } catch {
      getToasts().addDanger({
        title: 'Error editing agent groups',
        text: `Failed to update groups for agent ${agent.agent.name}`,
      });
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
        <EuiButton
          onClick={handleSave}
          fill
          isLoading={isSaving}
          disabled={selectedGroups.length === 0 || areGroupsUnchanged()}
        >
          Save
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
