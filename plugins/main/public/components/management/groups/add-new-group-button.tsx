import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiPopover,
  EuiSpacer,
} from '@elastic/eui';
import { WzButtonPermissions } from '../../common/permissions/button';
import GroupsHandler from '../../../controllers/management/components/management/groups/utils/groups-handler';
import { getToasts } from '../../../kibana-services';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';

const CREATE_GROUP_PERMISSIONS = [
  { action: 'group:create', resource: '*:*:*' },
];

interface AddNewGroupButtonProps {
  /* Called with the created group name, so the page can refresh its list. */
  onGroupCreated?: (groupName: string) => void | Promise<void>;
}

/* The API takes the name as an identifier, so spaces are dropped as typed. */
const sanitizeGroupName = (name: string) => name.split(' ').join('');

/* Shared by the Groups page and the Deploy new agent wizard: same label,
permission and popover in both. */
export const AddNewGroupButton = ({
  onGroupCreated,
}: AddNewGroupButtonProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isValidGroupName = groupName.trim().length > 0;

  const closePopover = () => {
    setIsPopoverOpen(false);
    setGroupName('');
  };

  const createGroup = async () => {
    if (!isValidGroupName || isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      await GroupsHandler.saveGroup(groupName);
    } catch (error) {
      /* Left open on failure so the rejected name can be fixed in place. */
      const options: UIErrorLog = {
        context: `${AddNewGroupButton.name}.createGroup`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: false,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: i18n.translate('wazuh.endpointGroups.addNewGroup.errorTitle', {
            defaultMessage: 'Error creating a new group',
          }),
        },
      };
      getErrorOrchestrator().handleError(options);
      return;
    } finally {
      setIsSaving(false);
    }

    getToasts().add({
      color: 'success',
      title: i18n.translate('wazuh.endpointGroups.addNewGroup.successTitle', {
        defaultMessage: 'Success',
      }),
      text: i18n.translate('wazuh.endpointGroups.addNewGroup.successText', {
        defaultMessage: 'The group has been created successfully',
      }),
      toastLifeTimeMs: 2000,
    });
    closePopover();
    await onGroupCreated?.(groupName);
  };

  const newGroupButton = (
    <WzButtonPermissions
      buttonType='empty'
      className='addNewGroupButton'
      iconSide='left'
      iconType='plusInCircle'
      permissions={CREATE_GROUP_PERMISSIONS}
      onClick={() => (isPopoverOpen ? closePopover() : setIsPopoverOpen(true))}
    >
      {i18n.translate('wazuh.endpointGroups.addNewGroup.button', {
        defaultMessage: 'Add new group',
      })}
    </WzButtonPermissions>
  );

  return (
    <EuiPopover
      button={newGroupButton}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
    >
      {/* No flex group here: its gutter is a negative margin that would eat
      the panel's own padding. */}
      <EuiForm
        component='form'
        onSubmit={event => {
          event.preventDefault();
          createGroup();
        }}
      >
        <EuiFormRow
          label={i18n.translate('wazuh.endpointGroups.addNewGroup.nameLabel', {
            defaultMessage: 'Introduce the group name',
          })}
          id='addNewGroupName'
        >
          <EuiFieldText
            value={groupName}
            onChange={event =>
              setGroupName(sanitizeGroupName(event.target.value))
            }
          />
        </EuiFormRow>
        <EuiSpacer size='m' />
        <WzButtonPermissions
          type='submit'
          permissions={CREATE_GROUP_PERMISSIONS}
          iconType='save'
          isDisabled={!isValidGroupName}
          isLoading={isSaving}
          fill
        >
          {i18n.translate('wazuh.endpointGroups.addNewGroup.saveButton', {
            defaultMessage: 'Save new group',
          })}
        </WzButtonPermissions>
      </EuiForm>
    </EuiPopover>
  );
};
