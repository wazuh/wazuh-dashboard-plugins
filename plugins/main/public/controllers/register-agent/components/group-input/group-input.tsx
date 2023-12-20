import React, { Fragment, useState } from 'react';
import {
  EuiComboBox,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiButtonEmpty,
  EuiLink,
} from '@elastic/eui';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import { PLUGIN_VERSION_SHORT } from '../../../../../common/constants';
import './group-input.scss';

const popoverAgentGroup = (
  <span>
    Learn about{' '}
    <EuiLink
      href={webDocumentationLink(
        'user-manual/reference/ossec-conf/client.html#groups',
        PLUGIN_VERSION_SHORT,
      )}
      target='_blank'
      rel='noopener noreferrer'
    >
      Select a group.
    </EuiLink>
  </span>
);

const GroupInput = ({ value, options, onChange }) => {
  const [isPopoverAgentGroup, setIsPopoverAgentGroup] = useState(false);

  const onButtonAgentGroup = () =>
    setIsPopoverAgentGroup(isPopoverAgentGroup => !isPopoverAgentGroup);
  const closeAgentGroup = () => setIsPopoverAgentGroup(false);
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
            Select one or more existing groups:
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
      <EuiComboBox
        placeholder={!value?.length ? 'Default' : 'Select group'}
        options={options?.groups}
        selectedOptions={value}
        onChange={group => {
          onChange({
            target: { value: group },
          });
        }}
        isDisabled={!options?.groups.length}
        isClearable={true}
        data-test-subj='demoComboBox'
        data-testid='group-input-combobox'
      />
      {!options?.groups.length && (
        <>
          <EuiCallOut
            style={{ marginTop: '1.5rem' }}
            color='warning'
            title='This section could not be configured because you do not have permission to read groups.'
            iconType='iInCircle'
            data-testid='group-input-callout'
          />
        </>
      )}
    </>
  );
};

export default GroupInput;
