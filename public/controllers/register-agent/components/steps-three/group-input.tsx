import React, { Fragment, useState } from 'react';
import {
  EuiComboBox,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiButtonEmpty,
} from '@elastic/eui';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import { PLUGIN_VERSION_SHORT } from '../../../../../common/constants';

const popoverAgentGroup = (
  <span>
    Learn about{' '}
    <a
      href={webDocumentationLink(
        'user-manual/reference/ossec-conf/client.html#groups',
        PLUGIN_VERSION_SHORT,
      )}
      target='_blank'
      rel='noopener noreferrer'
    >
      Select a group.
    </a>
  </span>
);

const GroupInput = ({ value, options, onChange }) => {
  const [isPopoverAgentGroup, setIsPopoverAgentGroup] = useState(false);

  const onButtonAgentGroup = () =>
    setIsPopoverAgentGroup(isPopoverAgentGroup => !isPopoverAgentGroup);
  const closeAgentGroup = () => setIsPopoverAgentGroup(false);
  return (
    <>
      <EuiFlexGroup>
        {/* <EuiFlexItem
          style={{
            marginTop: '32px',
            flexDirection: 'row',
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: '12px',
            lineHeight: '20px',
            color: '#343741',
          }}
          data-testid='group-input-label'
        >
          <p>Select one or more existing groups</p>
          <EuiIconTip
            content='Source maps allow browser dev tools to map minified code to the original source code'
            position='right'
          />
        </EuiFlexItem> */}
        <EuiFlexItem grow={false}>
          <EuiPopover
            button={
              <EuiButtonEmpty
                iconType='questionInCircle'
                iconSide='right'
                onClick={onButtonAgentGroup}
                // className='subtitleAgentName'
                style={{
                  marginTop: '32px',
                  flexDirection: 'row',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  fontSize: '12px',
                  lineHeight: '20px',
                  color: '#343741',
                }}
              >
                Select one or more existing groups
              </EuiButtonEmpty>
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
