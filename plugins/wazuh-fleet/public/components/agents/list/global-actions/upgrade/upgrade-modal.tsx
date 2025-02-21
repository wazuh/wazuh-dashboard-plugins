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
  EuiText,
  // EuiCallOut,
} from '@elastic/eui';
import { Agent } from '../../../../../../common/types';

export interface Result {
  successAgents?: [];
  errorMessage?: string;
  totalErrorAgents?: number;
  errorAgents?: [];
}

interface UpgradeAgentsModalProps {
  selectedAgents: Agent[];
  allAgentsSelected: boolean;
  // filters: any;
  onClose: () => void;
  reloadAgents: () => void;
  // setIsUpgradePanelClosed: (isUpgradePanelClosed: boolean) => void;
}

export const UpgradeAgentsModal = ({
  selectedAgents,
  // allAgentsSelected,
  // filters,
  onClose,
  reloadAgents,
  // setIsUpgradePanelClosed,
}: UpgradeAgentsModalProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [finalAgents, setFinalAgents] = useState<Agent[]>([]);
  const [getAgentsStatus, setGetAgentsStatus] = useState('disabled');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [getAgentsError, setGetAgentsError] = useState();
  const [saveChangesStatus, setSaveChangesStatus] = useState('disabled');
  const [isResultVisible, setIsResultVisible] = useState(false);
  // const [result, setResult] = useState<Result>();

  const getAgents = async () => {
    try {
      setGetAgentsStatus('complete');
      // return affected_items;
    } catch (error) {
      setGetAgentsStatus('danger');
      setGetAgentsError(error);
    }
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

    try {
      setSaveChangesStatus('complete');
    } catch {
      setSaveChangesStatus('danger');
    } finally {
      reloadAgents();
    }
  };

  const form = (
    <EuiForm component='form'>
      {/* {allAgentsSelected ? (
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
    </EuiForm>
  );

  return (
    <EuiModal onClose={onClose}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>Upgrade agents</EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        {/* {isResultVisible ? (
          <UpgradeAgentsModalResult
            finalAgents={finalAgents}
            getAgentsStatus={getAgentsStatus}
            getAgentsError={getAgentsError}
            saveChangesStatus={saveChangesStatus}
            result={result}
          />
        ) : ( */}
        {form}
        {/* )} */}
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
            <EuiButton onClick={handleOnSave} fill>
              Upgrade
            </EuiButton>
          </>
        )}
      </EuiModalFooter>
    </EuiModal>
  );
};
