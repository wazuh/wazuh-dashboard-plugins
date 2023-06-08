import React, { Component, Fragment, useState, useEffect } from 'react';
import {
  EuiText,
  EuiComboBox,
  EuiTitle,
  EuiIconTip,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';

export const GroupInput = props => {
  return (
    <EuiText style={{ marginTop: '1.5rem' }}>
      <p>Select one or more existing groups</p>
      <EuiComboBox
        placeholder={!props.value.length ? 'Default' : 'Select group'}
        options={props.options.groups}
        selectedOptions={props.value}
        onChange={group => {
          props.onChange({
            target: { value: group },
          }); // TODO: should not need the event.target.value
        }}
        isDisabled={!props.options.groups.length}
        isClearable={true}
        data-test-subj='demoComboBox'
      />
    </EuiText>
  );
};
