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
import { upgradeStatusState } from '../../services/upgrade-status-state';
import { endpointsSummaryI18n } from '../../i18n';

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
      const message = apiMessage || error?.message || endpointsSummaryI18n.unknownError;

      if (/permission denied/i.test(message)) {
        return endpointsSummaryI18n.noPermissionUpgradeAgent(message);
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
          endpointsSummaryI18n.upgradeAgentTitle,
          endpointsSummaryI18n.upgradeRequestSent,
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
            title: endpointsSummaryI18n.couldNotUpgradeAgent,
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
                    {endpointsSummaryI18n.agentId}
                  </EuiDescriptionListTitle>
                  <EuiDescriptionListDescription>
                    {agent.id}
                  </EuiDescriptionListDescription>
                </EuiDescriptionList>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiDescriptionList compressed>
                  <EuiDescriptionListTitle>
                    {endpointsSummaryI18n.agentName}
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
                    {endpointsSummaryI18n.agentVersion}
                  </EuiDescriptionListTitle>
                  <EuiDescriptionListDescription>
                    {agent.version}
                  </EuiDescriptionListDescription>
                </EuiDescriptionList>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiDescriptionList compressed>
                  <EuiDescriptionListTitle>
                    {endpointsSummaryI18n.os}
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
                    {endpointsSummaryI18n.packageType}{' '}
                    <EuiIconTip content={endpointsSummaryI18n.packageTypeTip} />
                  </span>
                }
                isInvalid={!packageType}
              >
                <EuiSelect
                  placeholder={endpointsSummaryI18n.packageTypePlaceholder}
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
            {endpointsSummaryI18n.upgradeAgentTitle}
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>{form}</EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={onClose}>
            {endpointsSummaryI18n.cancel}
          </EuiButtonEmpty>
          <EuiButton
            onClick={handleOnSave}
            fill
            isLoading={isLoading}
            disabled={showPackageSelector && !packageType}
          >
            {endpointsSummaryI18n.upgrade}
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  },
);
