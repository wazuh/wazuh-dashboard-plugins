import { EuiProgress } from '@elastic/eui';
import React from 'react';

interface LoadingSearchbarProgress {
  message?: React.ReactNode;
}

export function LoadingSearchbarProgress({
  message,
}: LoadingSearchbarProgress) {
  return <EuiProgress size='xs' color='primary' />;
}
