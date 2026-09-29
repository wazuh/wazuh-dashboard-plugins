import React, { useState } from 'react';
import {
  EuiComboBox,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiButtonEmpty,
  EuiLink,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { PLUGIN_VERSION_SHORT } from '../../../../../../common/constants';
import { AddNewGroupButton } from '../../../../management/groups/add-new-group-button';
import './group-input.scss';

interface GroupOption {
  label: string;
  id: string;
}

interface GroupInputProps {
  value?: GroupOption[];
  options?: { groups: GroupOption[] };
  onChange: (event: { target: { value: GroupOption[] } }) => void;
  /* Called with the created group name, so the wizard can reload its list. */
  onGroupCreated?: (groupName: string) => void | Promise<void>;
}

const popoverAgentGroup = (
  <span>
    <FormattedMessage
      id='wazuh.endpointsSummary.groupInput.learnAbout'
      defaultMessage='Learn about {documentationLink}'
      values={{
        documentationLink: (
          <EuiLink
            href={webDocumentationLink(
              'user-manual/agent/agent-management/grouping-agents.html',
              PLUGIN_VERSION_SHORT,
            )}
            target='_blank'
            rel='noopener noreferrer'
          >
            {i18n.translate(
              'wazuh.endpointsSummary.groupInput.documentationLink',
              { defaultMessage: 'Select a group.' },
            )}
          </EuiLink>
        ),
      }}
    />
  </span>
);

const GroupInput = ({
  value,
  options,
  onChange,
  onGroupCreated,
}: GroupInputProps) => {
  const [isPopoverAgentGroup, setIsPopoverAgentGroup] = useState(false);

  const onButtonAgentGroup = () =>
    setIsPopoverAgentGroup(isPopoverAgentGroup => !isPopoverAgentGroup);
  const closeAgentGroup = () => setIsPopoverAgentGroup(false);

  /* The group was created to enroll into it, so select it right away. */
  const handleGroupCreated = async (groupName: string) => {
    const selection = value ?? [];
    if (!selection.some(group => group.id === groupName)) {
      onChange({
        target: { value: [...selection, { label: groupName, id: groupName }] },
      });
    }
    await onGroupCreated?.(groupName);
  };

  return (
    <>
      <EuiFlexGroup
        style={{ marginTop: '32px' }}
        alignItems='center'
        direction='row'
        responsive={false}
        gutterSize='s'
      >
        <EuiFlexItem grow={false}>
          <p className='registerAgentLabels'>
            {i18n.translate('wazuh.endpointsSummary.groupInput.label', {
              defaultMessage: 'Select one or more existing groups:',
            })}
          </p>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiPopover
            button={
              <EuiButtonEmpty
                iconType='questionInCircle'
                iconSide='left'
                onClick={onButtonAgentGroup}
                style={{
                  flexDirection: 'row',
                  fontStyle: 'normal',
                  fontWeight: 700,
                }}
              ></EuiButtonEmpty>
            }
            isOpen={isPopoverAgentGroup}
            closePopover={closeAgentGroup}
            anchorPosition='rightCenter'
          >
            {popoverAgentGroup}
          </EuiPopover>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup alignItems='center' responsive={false} gutterSize='s'>
        <EuiFlexItem grow={false} className='registerAgentGroupsSelector'>
          <EuiComboBox
            placeholder={
              !value?.length
                ? i18n.translate(
                    'wazuh.endpointsSummary.groupInput.placeholderDefault',
                    { defaultMessage: 'Default' },
                  )
                : i18n.translate(
                    'wazuh.endpointsSummary.groupInput.placeholderSelect',
                    { defaultMessage: 'Select group' },
                  )
            }
            options={options?.groups}
            selectedOptions={value}
            onChange={selection => {
              /* The combo returns the option objects it was given, which carry
              the group id EUI's type does not know about. */
              onChange({
                target: { value: selection as GroupOption[] },
              });
            }}
            isDisabled={!options?.groups.length}
            isClearable={true}
            data-test-subj='demoComboBox'
            data-testid='group-input-combobox'
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <AddNewGroupButton onGroupCreated={handleGroupCreated} />
        </EuiFlexItem>
      </EuiFlexGroup>
      {!options?.groups.length && (
        <>
          <EuiCallOut
            style={{ marginTop: '1.5rem' }}
            color='warning'
            title={i18n.translate(
              'wazuh.endpointsSummary.groupInput.noGroupsAvailable',
              {
                defaultMessage:
                  'No groups available. Groups may not exist yet or there was an issue loading them.',
              },
            )}
            iconType='iInCircle'
            data-testid='group-input-callout'
          />
        </>
      )}
    </>
  );
};

export default GroupInput;
