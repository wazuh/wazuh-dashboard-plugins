import {
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiPageHeader,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import React, { useState } from 'react';
import { tableColumns } from './columns';

export interface CommandListProps {
  FleetCommandsDataSource: any;
  FleetCommandsDataSourceRepository: any;
  TableIndexer: any;
}

import { getCore } from '../../../plugin-services';

export const CommandsList = ({
  FleetCommandsDataSource,
  FleetCommandsDataSourceRepository,
  TableIndexer,
}: CommandListProps) => {
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [command, setCommand] = useState();

  return (
    <>
      <EuiPageHeader pageTitle='Agents commands' />
      <EuiSpacer />
      <TableIndexer
        DataSource={FleetCommandsDataSource}
        DataSourceRepository={FleetCommandsDataSourceRepository}
        columns={tableColumns({
          setIsFlyoutAgentVisible: setIsFlyoutVisible,
          setCommand,
        })}
        tableProps={{
          hasActions: true,
        }}
      />
      {isFlyoutVisible ? (
        <EuiFlyout
          ownFocus
          onClose={() => setIsFlyoutVisible(false)}
          aria-labelledby='flyout'
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='m'>
              <h2>{command?.process?.name}</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody></EuiFlyoutBody>
        </EuiFlyout>
      ) : null}
    </>
  );
};
