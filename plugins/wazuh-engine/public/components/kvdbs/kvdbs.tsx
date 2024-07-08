import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPage } from '@elastic/eui';
import { KVDBTable } from './components/kvdb-overview';
import { getServices } from '../../services';

export const KVDBs = () => {
  return (
    <EuiPage style={{ background: 'transparent' }}>
      <EuiFlexGroup>
        <EuiFlexItem>
          <KVDBTable TableWzAPI={getServices().TableWzAPI} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPage>
  );
};
