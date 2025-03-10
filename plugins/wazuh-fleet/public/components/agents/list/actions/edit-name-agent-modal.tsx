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
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';
import { getAgentManagement } from '../../../../plugin-services';
import { IAgentResponse } from '../../../../../common/types';

interface EditAgentNameModalProps {
  agent: IAgentResponse;
  onClose: () => void;
  reloadAgents: () => void;
}

export const EditAgentNameModal = ({
  agent,
  onClose,
  reloadAgents,
}: EditAgentNameModalProps) => {
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validateName, setValidateName] = useState<{
    isInvalid: boolean;
    errors: string[];
  }>({
    isInvalid: false,
    errors: [],
  });

  const validateInput = (name: string) => {
    const errors: string[] = [];

    if (name === agent._source.agent.name) {
      errors.push('New agent name cannot be the same as the current one');
    }

    if (name.length < 3) {
      errors.push('Agent name must be at least 3 characters long');
    }

    if (name.length > 50) {
      errors.push('Agent name cannot exceed 50 characters');
    }

    setValidateName({
      isInvalid: errors.length > 0,
      errors: errors,
    });
  };

  const handleOnSave = async () => {
    try {
      setIsSaving(true);
      await getAgentManagement().editName(agent._source.agent.id, newName);
      setIsSaving(false);
      reloadAgents();
      onClose();
    } catch {
      setIsSaving(false);
    }
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
                  {agent._source.agent.id}
                </EuiDescriptionListDescription>
              </EuiDescriptionList>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiDescriptionList compressed>
                <EuiDescriptionListTitle>Agent name</EuiDescriptionListTitle>
                <EuiDescriptionListDescription>
                  {agent._source.agent.name}
                </EuiDescriptionListDescription>
              </EuiDescriptionList>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow
            label='New name'
            isInvalid={validateName.isInvalid}
            error={validateName.errors}
          >
            <EuiFieldText
              placeholder='Type a new agent name'
              onChange={(value: { target: { value: string } }) => {
                setNewName(value.target.value);
                validateInput(value.target.value);
              }}
              value={newName}
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
        <EuiModalHeaderTitle>Edit agent name</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>{form}</EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
        <EuiButton
          disabled={validateName.isInvalid}
          onClick={handleOnSave}
          fill
          isLoading={isSaving}
        >
          Save
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
