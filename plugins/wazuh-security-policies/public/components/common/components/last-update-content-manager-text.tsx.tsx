import React from 'react';
import { EuiLink } from '@elastic/eui';

export const LastUpdateContentManagerText = (lastUpdate: {
  lastUpdateDate: string;
  status: string;
}) => (
  <>
    Last update of the content manager was {lastUpdate.lastUpdateDate} (
    {lastUpdate.status}).{' '}
    <EuiLink href='link-documentation' target='_blank'>
      Learn more
    </EuiLink>
  </>
);
