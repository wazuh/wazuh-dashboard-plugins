import React from 'react';
import { EuiIcon, EuiLoadingSpinner } from '@elastic/eui';
import { StepStatus } from './types';

interface StepIconProps {
  status: StepStatus;
}

const StepIcon = ({ status }: StepIconProps) => {
  switch (status) {
    case StepStatus.LOADING:
      return <EuiLoadingSpinner size='m' />;
    case StepStatus.SUCCESS:
      return <EuiIcon type='check' color='success' />;
    case StepStatus.ERROR:
      return <EuiIcon type='cross' color='danger' />;
    case StepStatus.WARNING:
      return <EuiIcon type='alert' color='warning' />;
    case StepStatus.PENDING:
    default:
      return <EuiIcon type='clock' color='subdued' />;
  }
};

export default StepIcon;
