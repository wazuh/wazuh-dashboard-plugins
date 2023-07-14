import React from 'react';
import { AGENT_STATUS_CODE } from '../../../common/constants';
import { ColumnWithStatusIcon } from './column-with-status-icon';

interface SyncedProps {
  statusCode: number;
}

interface StatusCodeAgent {
  STATUS_CODE: number;
  COLOR: string;
  STATUS_DESCRIPTION: string;
}

export const AgentStatusCode = ({ statusCode }: SyncedProps) => {
  const statusCodeAgent = AGENT_STATUS_CODE.find(
    (status: StatusCodeAgent) => status.STATUS_CODE === statusCode,
  );

  return (
    <ColumnWithStatusIcon
      color={statusCodeAgent?.COLOR ?? 'subdued'}
      text={statusCodeAgent?.STATUS_DESCRIPTION ?? 'Without information'}
    />
  );
};
