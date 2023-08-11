import React from 'react';
import { AGENT_SYNCED_STATUS } from '../../../common/constants';
import { ColumnWithStatusIcon } from './column-with-status-icon';

interface SyncedProps {
  synced: string;
}

export const AgentSynced = ({ synced }: SyncedProps) => {
  const color = {
    [AGENT_SYNCED_STATUS.SYNCED]: 'success',
    [AGENT_SYNCED_STATUS.NOT_SYNCED]: 'subdued',
  }[synced];

  return <ColumnWithStatusIcon color={color} text={synced} />;
};
