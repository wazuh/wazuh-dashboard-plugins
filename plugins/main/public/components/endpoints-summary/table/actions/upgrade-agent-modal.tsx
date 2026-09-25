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
import { i18n } from '@osd/i18n';
import { compose } from 'redux';
import { withErrorBoundary } from '../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { upgradeAgentService } from '../../services';
import { Agent } from '../../types';
import { getToasts } from '../../../../kibana-services';
import { upgradeStatusState } from '../../services/upgrade-status-state';

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
}

export const UpgradeAgentModal = compose(withErrorBoundary)(
  ({ agent, onClose, reloadAgents }: UpgradeAgentModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [packageType, setPackageType] = useState<'deb' | 'rpm'>();

    const getUpgradeErrorMessage = (error: any) => {
      const apiMessage = error?.response?.data?.message;
      const message =
        apiMessage ||
        error?.message ||
        i18n.translate(
          'wazuh.endpointsSummary.upgradeAgentModal.unknownError',
          { defaultMessage: 'Unknown error' },
        );

      if (/permission denied/i.test(message)) {
        return i18n.translate(
          'wazuh.endpointsSummary.upgradeAgentModal.noPermissionsError',
          {
            defaultMessage: 'No permissions to upgrade this agent. {message}',
            values: { message },
          },
        );
      }

      return message;
    };

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
        if (agent.version) {
          upgradeStatusState.trackUpgrade([
            { id: agent.id, version: agent.version },
          ]);
        }
        showToast(
          'success',
          i18n.translate(
            'wazuh.endpointsSummary.upgradeAgentModal.successToastTitle',
            { defaultMessage: 'Upgrade agent' },
          ),
          i18n.translate(
            'wazuh.endpointsSummary.upgradeAgentModal.successToastText',
            { defaultMessage: 'Upgrade request sent successfully' },
          ),
        );
        reloadAgents();
      } catch (error: any) {
        const errorMessage = getUpgradeErrorMessage(error);
        const options = {
          context: `UpgradeAgentModal.handleOnSave`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: errorMessage,
            title: i18n.translate(
              'wazuh.endpointsSummary.upgradeAgentModal.errorTitle',
              { defaultMessage: 'Could not upgrade agent' },
            ),
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
                  <EuiDescriptionListTitle>
                    {i18n.translate(
                      'wazuh.endpointsSummary.upgradeAgentModal.agentIdLabel',
                      { defaultMessage: 'Agent ID' },
                    )}
                  </EuiDescriptionListTitle>
                  <EuiDescriptionListDescription>
                    {agent.id}
                  </EuiDescriptionListDescription>
                </EuiDescriptionList>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiDescriptionList compressed>
                  <EuiDescriptionListTitle>
                    {i18n.translate(
                      'wazuh.endpointsSummary.upgradeAgentModal.agentNameLabel',
                      { defaultMessage: 'Agent name' },
                    )}
                  </EuiDescriptionListTitle>
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
                    {i18n.translate(
                      'wazuh.endpointsSummary.upgradeAgentModal.agentVersionLabel',
                      { defaultMessage: 'Agent version' },
                    )}
                  </EuiDescriptionListTitle>
                  <EuiDescriptionListDescription>
                    {agent.version}
                  </EuiDescriptionListDescription>
                </EuiDescriptionList>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiDescriptionList compressed>
                  <EuiDescriptionListTitle>
                    {i18n.translate(
                      'wazuh.endpointsSummary.upgradeAgentModal.osLabel',
                      { defaultMessage: 'OS' },
                    )}
                  </EuiDescriptionListTitle>
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
                    {i18n.translate(
                      'wazuh.endpointsSummary.upgradeAgentModal.packageTypeLabel',
                      { defaultMessage: 'Package type' },
                    )}{' '}
                    <EuiIconTip
                      content={i18n.translate(
                        'wazuh.endpointsSummary.upgradeAgentModal.packageTypeTooltip',
                        {
                          defaultMessage:
                            "Specify the package type, as the manager can't determine it automatically for the OS platform",
                        },
                      )}
                    />
                  </span>
                }
                isInvalid={!packageType}
              >
                <EuiSelect
                  placeholder={i18n.translate(
                    'wazuh.endpointsSummary.upgradeAgentModal.packageTypePlaceholder',
                    { defaultMessage: 'Packege type' },
                  )}
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
          <EuiModalHeaderTitle>
            {i18n.translate('wazuh.endpointsSummary.upgradeAgentModal.title', {
              defaultMessage: 'Upgrade agent',
            })}
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>{form}</EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={onClose}>
            {i18n.translate(
              'wazuh.endpointsSummary.upgradeAgentModal.cancelButton',
              { defaultMessage: 'Cancel' },
            )}
          </EuiButtonEmpty>
          <EuiButton
            onClick={handleOnSave}
            fill
            isLoading={isLoading}
            disabled={showPackageSelector && !packageType}
          >
            {i18n.translate(
              'wazuh.endpointsSummary.upgradeAgentModal.upgradeButton',
              { defaultMessage: 'Upgrade' },
            )}
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  },
);
