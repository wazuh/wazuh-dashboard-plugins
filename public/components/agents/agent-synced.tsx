import React from 'react';
import { EuiHealth } from "@elastic/eui";
import { AGENT_SYNCED_STATUS } from '../../../common/constants';

interface SyncedProps {
  synced: string;
}

export const AgentSynced = ({ synced }: SyncedProps) => {
  const color = {
    [AGENT_SYNCED_STATUS.SYNCED]: 'success',
    [AGENT_SYNCED_STATUS.NOT_SYNCED]: 'subdued',
  }[synced];

  return (
    <EuiHealth color={color}>
      <span className={'hide-agent-status'}>
        {synced}
      </span>
    </EuiHealth>
  );
}