import React, { useState, useEffect } from 'react';
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
  EuiCallOut,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { compose } from 'redux';
import { withErrorBoundary } from '../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { useGetGroups } from '../../hooks';
import {
  addAgentToGroupService,
  removeAgentFromGroupsService,
} from '../../services';
import { Agent } from '../../types';
import { getToasts } from '../../../../kibana-services';

interface EditAgentGroupsModalProps {
  agent: Agent;
  onClose: () => void;
  reloadAgents: () => void;
}

export const EditAgentGroupsModal = compose(withErrorBoundary)(
  ({ agent, onClose, reloadAgents }: EditAgentGroupsModalProps) => {
    const [selectedGroups, setSelectedGroups] = useState(
      agent.group?.map(group => ({ label: group })) || [],
    );
    const [isSaving, setIsSaving] = useState(false);

    const {
      groups,
      isLoading: isGroupsLoading,
      error: errorGroups,
    } = useGetGroups();

    if (errorGroups) {
      const options = {
        context: `EditAgentGroupsModal.useGetGroups`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: errorGroups,
          message: errorGroups.message || errorGroups,
          title: i18n.translate(
            'wazuh.endpointsSummary.editGroupsModal.getGroupsErrorTitle',
            { defaultMessage: 'Could not get groups' },
          ),
        },
      };
      getErrorOrchestrator().handleError(options);
    }

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

    const getEditGroupsErrorMessage = (error: any) => {
      const apiMessage = error?.response?.data?.message;
      const message =
        apiMessage ||
        error?.message ||
        i18n.translate('wazuh.endpointsSummary.editGroupsModal.unknownError', {
          defaultMessage: 'Unknown error',
        });

      if (/permission denied/i.test(message)) {
        return i18n.translate(
          'wazuh.endpointsSummary.editGroupsModal.noPermissionsError',
          {
            defaultMessage:
              'No permissions to edit this agent groups. {message}',
            values: { message },
          },
        );
      }

      return message;
    };

    const handleOnSave = async () => {
      setIsSaving(true);

      const flatSelectedGroups = selectedGroups.map(group => group.label);
      const addedGroups =
        flatSelectedGroups.filter(group => !agent.group?.includes(group)) || [];
      const removedGroups =
        agent.group?.filter(group => !flatSelectedGroups.includes(group)) || [];

      if (!removedGroups.length && !addedGroups.length) {
        setIsSaving(false);
        onClose();
        return;
      }

      try {
        addedGroups.length &&
          (await Promise.all(
            addedGroups?.map(groupId =>
              addAgentToGroupService({ agentId: agent.id, groupId }),
            ),
          ));
        removedGroups.length &&
          (await removeAgentFromGroupsService({
            agentId: agent.id,
            groupIds: removedGroups,
          }));
        showToast(
          'success',
          i18n.translate(
            'wazuh.endpointsSummary.editGroupsModal.successToastTitle',
            { defaultMessage: 'Edit agent groups' },
          ),
          i18n.translate(
            'wazuh.endpointsSummary.editGroupsModal.successToastText',
            { defaultMessage: 'Groups saved successfully' },
          ),
        );
        reloadAgents();
      } catch (error: any) {
        const errorMessage = getEditGroupsErrorMessage(error);
        const options = {
          context: `EditAgentGroupsModal.handleOnSave`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: errorMessage,
            title: i18n.translate(
              'wazuh.endpointsSummary.editGroupsModal.saveErrorTitle',
              { defaultMessage: 'Could not save agent groups' },
            ),
          },
        };
        getErrorOrchestrator().handleError(options);
      } finally {
        setIsSaving(false);
        onClose();
      }
    };

    const form = (
      <EuiForm component='form'>
        <EuiFlexGroup direction='column' gutterSize='m'>
          <EuiFlexItem>
            <EuiFlexGroup gutterSize='m'>
              <EuiFlexItem>
                <EuiDescriptionList compressed>
                  <EuiDescriptionListTitle>
                    {i18n.translate(
                      'wazuh.endpointsSummary.editGroupsModal.agentIdLabel',
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
                      'wazuh.endpointsSummary.editGroupsModal.agentNameLabel',
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
            <EuiFormRow
              label={i18n.translate(
                'wazuh.endpointsSummary.editGroupsModal.groupsLabel',
                { defaultMessage: 'Groups' },
              )}
              isInvalid={!selectedGroups?.length}
              error={[
                i18n.translate(
                  'wazuh.endpointsSummary.editGroupsModal.groupsRequiredError',
                  { defaultMessage: 'You must add at least one group' },
                ),
              ]}
            >
              <EuiComboBox
                placeholder={i18n.translate(
                  'wazuh.endpointsSummary.editGroupsModal.groupsPlaceholder',
                  { defaultMessage: 'Select groups' },
                )}
                options={groups?.map(group => ({ label: group })) || []}
                selectedOptions={selectedGroups}
                onChange={selectedGroups => setSelectedGroups(selectedGroups)}
                isLoading={isGroupsLoading}
                clearOnBlur
              />
            </EuiFormRow>
            {errorGroups ? (
              <EuiCallOut
                color='danger'
                iconType='alert'
                title={i18n.translate(
                  'wazuh.endpointsSummary.editGroupsModal.loadGroupsErrorCallout',
                  {
                    defaultMessage:
                      'Could not load groups. Check your permissions.',
                  },
                )}
              />
            ) : !isGroupsLoading && !groups?.length ? (
              <EuiCallOut
                color='warning'
                iconType='iInCircle'
                title={i18n.translate(
                  'wazuh.endpointsSummary.editGroupsModal.noGroupsCallout',
                  { defaultMessage: 'No groups available.' },
                )}
              />
            ) : null}
          </EuiFlexItem>
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
            {i18n.translate('wazuh.endpointsSummary.editGroupsModal.title', {
              defaultMessage: 'Edit agent groups',
            })}
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>{form}</EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={onClose}>
            {i18n.translate(
              'wazuh.endpointsSummary.editGroupsModal.cancelButton',
              { defaultMessage: 'Cancel' },
            )}
          </EuiButtonEmpty>
          <EuiButton
            onClick={handleOnSave}
            fill
            isLoading={isSaving}
            disabled={isGroupsLoading || !selectedGroups?.length}
          >
            {i18n.translate(
              'wazuh.endpointsSummary.editGroupsModal.saveButton',
              { defaultMessage: 'Save' },
            )}
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  },
);
