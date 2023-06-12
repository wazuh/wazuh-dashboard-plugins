import React, { Fragment } from 'react';
import {
  EuiComboBox,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
} from '@elastic/eui';

const groupInput = ({ value, options, onChange }) => {
  return (
    <>
      <EuiFlexGroup>
        <EuiFlexItem
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
          <p>Select one or more existing groups</p>
          <EuiIconTip
            content='Source maps allow browser dev tools to map minified code to the original source code'
            position='right'
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiComboBox
        placeholder={!value?.length ? 'Default' : 'Select group'} // ver
        options={options?.groups}
        selectedOptions={value}
        onChange={group => {
          onChange({
            target: { value: group },
          }); // TODO: should not need the event.target.value
        }}
        isDisabled={!options?.groups.length}
        isClearable={true}
        data-test-subj='demoComboBox'
      />
      {!options?.groups.length && (
        <>
          <EuiCallOut
            style={{ marginTop: '1.5rem' }}
            color='warning'
            title='This section could not be configured because you do not have permission to read groups.'
            iconType='iInCircle'
          />
        </>
      )}
    </>
  );
};

export default groupInput;
