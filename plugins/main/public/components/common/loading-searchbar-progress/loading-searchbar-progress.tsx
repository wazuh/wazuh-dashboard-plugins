import { EuiProgress } from '@elastic/eui';
import React from 'react';
import './loading-searchbar-progress.scss';

interface LoadingSearchbarProgress {
  message?: React.ReactNode;
}

export function LoadingSearchbarProgress({
  message,
}: LoadingSearchbarProgress) {
  return (
    <EuiProgress size='xs' color='primary' />
  );
}
