import React, { useState } from 'react';
import {
  EuiForm,
  EuiFormRow,
  EuiSelect,
  EuiFlexGroup,
  EuiFlexItem,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiButton,
  EuiModalBody,
  EuiModalFooter,
  EuiButtonEmpty,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiIconTip,
} from '@elastic/eui';
import { getAgentManagement, getToasts } from '../../../../plugin-services';
import { IAgentResponse } from '../../../../../common/types';

const supportedPlatforms = new Set([
  'debian',
  'ubuntu',
  'amzn',
  'centos',
  'fedora',
  'ol',
  'opensuse',
  'opensuse-leap',
  'opensuse-tumbleweed',
  'rhel',
  'sles',
  'suse',
]);

interface UpgradeAgentModalProps {
  agent: IAgentResponse;
  onClose: () => void;
  reloadAgents: () => void;
}

export const UpgradeAgentModal = ({
  agent,
  onClose,
  reloadAgents,
}: UpgradeAgentModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [packageType, setPackageType] = useState<'deb' | 'rpm'>();

  const showToast = (color: string, title = '', text = '', time = 3000) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  const handleOnSave = async () => {
    setIsLoading(true);

    try {
      await getAgentManagement().upgrade(agent._source.agent.id);
      showToast('success', 'Upgrade agent', 'Upgrade task in progress');
      reloadAgents();
    } catch (error) {
      showToast('danger', 'Upgrade agent', error.message);
    } finally {
      onClose();
    }
  };

  const regex = /linux/i;
  const isLinux = regex.test(agent._source.agent.host.os.platform);
  const showPackageSelector =
    isLinux && !supportedPlatforms.has(agent._source.agent.host.os.name);
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
          <EuiFlexGroup gutterSize='m'>
            <EuiFlexItem>
              <EuiDescriptionList compressed>
                <EuiDescriptionListTitle>Agent version</EuiDescriptionListTitle>
                <EuiDescriptionListDescription>
                  {agent._source.agent.version}
                </EuiDescriptionListDescription>
              </EuiDescriptionList>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiDescriptionList compressed>
                <EuiDescriptionListTitle>OS</EuiDescriptionListTitle>
                <EuiDescriptionListDescription>
                  {agent._source.agent.host.os.name}
                </EuiDescriptionListDescription>
              </EuiDescriptionList>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        {showPackageSelector && (
          <EuiFlexItem>
            <EuiFormRow
              label={
                <span>
                  Package type{' '}
                  <EuiIconTip content="Specify the package type, as the manager can't determine it automatically for the OS platform" />
                </span>
              }
              isInvalid={!packageType}
            >
              <EuiSelect
                placeholder='Packege type'
                value={packageType}
                options={[
                  { value: 'deb', text: 'DEB' },
                  { value: 'rpm', text: 'RPM' },
                ]}
                onChange={event => setPackageType(event.target.value)}
                hasNoInitialSelection
              />
            </EuiFormRow>
          </EuiFlexItem>
        )}
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
        <EuiModalHeaderTitle>Upgrade agent</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>{form}</EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
        <EuiButton
          onClick={handleOnSave}
          fill
          isLoading={isLoading}
          disabled={showPackageSelector && !packageType}
        >
          Upgrade
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
