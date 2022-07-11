import React from 'react';
import { EuiHealth } from "@elastic/eui";

interface SyncedProps {
    synced: string;
}

export const AgentSynced = ({ synced }:SyncedProps) => {
    const color = {
        synced: 'success',
        'not synced': 'subdued',
      }[synced];

      return (
        <EuiHealth color={color}>
          <span className={'hide-agent-status'}>
            {synced}
          </span>
        </EuiHealth>
      );
}