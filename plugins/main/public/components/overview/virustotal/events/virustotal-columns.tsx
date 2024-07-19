import { tDataGridColumn } from '../../../common/data-grid';
import React from 'react';
import { EuiLink } from '@elastic/eui';

export const virustotalColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
  },
  {
    id: 'agent.name',
  },
  {
    id: 'data.virustotal.source.file',
  },
  {
    id: 'data.virustotal.permalink',
    render: value => {
      if (!value) {
        return '-';
      } else {
        return (
          <EuiLink href={value} target='_blank' external>
            {value}
          </EuiLink>
        );
      }
    },
  },
  {
    id: 'data.virustotal.malicious',
  },
  {
    id: 'data.virustotal.positives',
  },
  {
    id: 'data.virustotal.total',
  },
];
