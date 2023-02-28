import React from 'react';
import {
  EuiText,
  EuiTitle,
} from '@elastic/eui';

interface kpi {
  title: string;
  value: string;
}
export function WzKpi({title, value}: kpi) {
  return <>
    <EuiTitle size="xs" ><h3>{title}</h3></EuiTitle>
    <EuiText size="xs">{value}</EuiText>
  </>
}
