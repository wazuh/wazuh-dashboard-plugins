import React from 'react';
import { ModelStatus } from '../modules/model/domain/enums/model-status';
import { EuiIcon } from '@elastic/eui';

interface StatusIconProps {
  status: ModelStatus;
}

const StatusIcon = ({ status }: StatusIconProps) => {
  switch (status) {
    case ModelStatus.ACTIVE:
      return <EuiIcon type='dot' color='success' />;
    case ModelStatus.INACTIVE:
      return <EuiIcon type='dot' color='subdued' />;
    case ModelStatus.ERROR:
      return <EuiIcon type='dot' color='danger' />;
    default:
      return <EuiIcon type='dot' color='subdued' />;
  }
};

export default StatusIcon;
