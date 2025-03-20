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

type PackageType = 'deb' | 'rpm';

interface IOption {
  value: string;
  text: string;
}

export const UpgradeAgentModal = ({
  agent,
  onClose,
  reloadAgents,
}: UpgradeAgentModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [packageType, setPackageType] = useState<PackageType>();
  const optionSelector: IOption[] = [
    { value: 'deb', text: 'DEB' },
    { value: 'rpm', text: 'RPM' },
  ];

  const handleSave = async () => {
    setIsLoading(true);

    try {
      await getAgentManagement().upgrade(agent.agent.id);
      getToasts().addInfo({
        title: 'Upgrade agent',
        text: 'Upgrade task in progress',
      });
      reloadAgents();
    } catch (error) {
      getToasts().addDanger({ title: 'Upgrade agent', text: error.message });
      setIsLoading(false);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const regex = /linux/i;
  const isLinux = regex.test(agent.agent.host.os.platform);
  const showPackageSelector =
    isLinux && !supportedPlatforms.has(agent.agent.host.os.name);
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
          <EuiFlexGroup gutterSize='m'>
            <EuiFlexItem>
              <EuiDescriptionList compressed>
                <EuiDescriptionListTitle>Agent version</EuiDescriptionListTitle>
                <EuiDescriptionListDescription>
                  {agent.agent.version}
                </EuiDescriptionListDescription>
              </EuiDescriptionList>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiDescriptionList compressed>
                <EuiDescriptionListTitle>OS</EuiDescriptionListTitle>
                <EuiDescriptionListDescription>
                  {agent.agent.host.os.name}
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
                options={optionSelector}
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
          onClick={handleSave}
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
