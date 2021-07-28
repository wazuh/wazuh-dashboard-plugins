import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiButtonEmpty, EuiTitle } from '@elastic/eui';
import { VisConfigLayout } from '../../../common/modules/panel/components';


export const OfficeDrilldown = ({ title = '', changeView, toggleFilter, rows = [], selectedFilter = { field: '', value: '' } }) => {

  const rowClickHandler = () => {
    toggleFilter(selectedFilter.field);
    changeView('main');
  }

  return <>
    <EuiFlexGroup className={'wz-margin-0'}>
      <EuiFlexItem grow={false}>
        <div><EuiButtonEmpty onClick={() => rowClickHandler()} iconType={"sortLeft"}></EuiButtonEmpty></div>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiTitle size="s">
          <h3>{title}</h3>
        </EuiTitle>
        <p>{selectedFilter.value}</p>
      </EuiFlexItem>
    </EuiFlexGroup>
    <VisConfigLayout rows={rows} rowClickHandler={rowClickHandler} />

  </>
}