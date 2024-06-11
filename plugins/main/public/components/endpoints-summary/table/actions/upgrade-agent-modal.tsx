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
import { compose } from 'redux';
import { withErrorBoundary } from '../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { upgradeAgentService } from '../../services';
import { Agent } from '../../types';
import { getToasts } from '../../../../kibana-services';

const supportedPlatforms = [
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
];

interface UpgradeAgentModalProps {
  agent: Agent;
  onClose: () => void;
  reloadAgents: () => void;
  setIsUpgradePanelClosed: (isUpgradePanelClosed: boolean) => void;
}

export const UpgradeAgentModal = compose(withErrorBoundary)(
  ({
    agent,
    onClose,
    reloadAgents,
    setIsUpgradePanelClosed,
  }: UpgradeAgentModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [packageType, setPackageType] = useState<'deb' | 'rpm'>();

    const showToast = (
      color: string,
      title: string = '',
      text: string = '',
      time: number = 3000,
    ) => {
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
        await upgradeAgentService(agent.id, packageType);
        showToast('success', 'Upgrade agent', 'Upgrade task in progress');
        reloadAgents();
        setIsUpgradePanelClosed(false);
      } catch (error) {
        const options = {
          context: `UpgradeAgentModal.handleOnSave`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: error.message || error,
            title: `Could not upgrade agent`,
          },
        };
        getErrorOrchestrator().handleError(options);
      } finally {
        onClose();
      }
    };

    const regex = /linux/i;
    const isLinux = regex.test(agent.os.uname);
    const showPackageSelector =
      isLinux && !supportedPlatforms.includes(agent.os.platform);

    const form = (
      <EuiForm component='form'>
        <EuiFlexGroup direction='column' gutterSize='m'>
          <EuiFlexItem>
            <EuiFlexGroup gutterSize='m'>
              <EuiFlexItem>
                <EuiDescriptionList compressed>
                  <EuiDescriptionListTitle>Agent ID</EuiDescriptionListTitle>
                  <EuiDescriptionListDescription>
                    {agent.id}
                  </EuiDescriptionListDescription>
                </EuiDescriptionList>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiDescriptionList compressed>
                  <EuiDescriptionListTitle>Agent name</EuiDescriptionListTitle>
                  <EuiDescriptionListDescription>
                    {agent.name}
                  </EuiDescriptionListDescription>
                </EuiDescriptionList>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup gutterSize='m'>
              <EuiFlexItem>
                <EuiDescriptionList compressed>
                  <EuiDescriptionListTitle>
                    Agent version
                  </EuiDescriptionListTitle>
                  <EuiDescriptionListDescription>
                    {agent.version}
                  </EuiDescriptionListDescription>
                </EuiDescriptionList>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiDescriptionList compressed>
                  <EuiDescriptionListTitle>OS</EuiDescriptionListTitle>
                  <EuiDescriptionListDescription>
                    {agent.os.name}
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
                  onChange={e => setPackageType(e.target.value)}
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
        onClick={ev => {
          ev.stopPropagation();
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
  },
);
