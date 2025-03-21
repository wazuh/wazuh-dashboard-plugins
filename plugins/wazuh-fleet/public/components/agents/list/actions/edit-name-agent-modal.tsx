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

const AGENT_NAME_MIN_LENGTH = 3;
const AGENT_NAME_MAX_LENGTH = 50;

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
    isValid: boolean;
    isInvalid: boolean;
    errors: string[];
  }>({
    isValid: true,
    isInvalid: false,
    errors: [],
  });
  const agentNameErrorMessages = {
    minLength: `Agent name must be at least ${AGENT_NAME_MIN_LENGTH} characters long`,
    maxLength: `Agent name cannot exceed ${AGENT_NAME_MAX_LENGTH} characters`,
    newAgentIdentifier: 'New agent name cannot be the same as the current one',
  };

  const validateInput = (name: string) => {
    const errors: string[] = [];

    if (name === agent.agent.name) {
      errors.push(agentNameErrorMessages.newAgentIdentifier);
    }

    if (name.length < AGENT_NAME_MIN_LENGTH) {
      errors.push(agentNameErrorMessages.minLength);
    }

    if (name.length > AGENT_NAME_MAX_LENGTH) {
      errors.push(agentNameErrorMessages.maxLength);
    }

    setValidateName({
      isValid: errors.length === 0,
      isInvalid: errors.length > 0,
      errors: errors,
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await getAgentManagement().editName(agent.agent.id, newName);
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
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();

                  if (validateName.isValid) {
                    handleSave();
                  }
                }
              }}
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
          onClick={handleSave}
          fill
          isLoading={isSaving}
        >
          Save
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
