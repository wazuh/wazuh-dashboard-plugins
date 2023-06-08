import React, { Component, Fragment, useState, useEffect } from 'react';
import { EuiText, EuiComboBox } from '@elastic/eui';

const groupInput = ({ value, options, onChange }) => {
  return (
    <EuiText style={{ marginTop: '1.5rem' }}>
      <p>Select one or more existing groups</p>
      <EuiComboBox
        placeholder={!value?.length ? 'Default' : 'Select group'} //ver
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
    </EuiText>
  );
};

export default groupInput;
