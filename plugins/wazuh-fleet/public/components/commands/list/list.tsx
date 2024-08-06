import { EuiButton, EuiFlyout, EuiFlyoutBody, EuiFlyoutHeader, EuiLink, EuiPageHeader, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
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
    DocDetails,
    useDataSource
}: CommandListProps) => {
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
    const [command, setCommand] = useState();


    const {
        dataSource
    } = useDataSource({
        repository: new FleetCommandsDataSourceRepository(), // this makes only works with alerts index pattern
        DataSource: FleetCommandsDataSource
    });
    return (
        <>
            <EuiPageHeader
                pageTitle='Commands'
            />
            <EuiSpacer size='l' />
            <TableIndexer
                DataSource={FleetCommandsDataSource}
                DataSourceRepository={FleetCommandsDataSourceRepository}
                columns={tableColumns({
                    setIsFlyoutAgentVisible: setIsFlyoutVisible,
                    setCommand,
                })}
                tableProps={{
                    hasActions: true
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
                            <h2>
                                <EuiLink
                                    href={getCore().application.getUrlForApp('fleet-management', {
                                        path: `#/fleet-management/commands/${command.id}`,
                                    })}
                                    target='_blank'
                                >
                                    {command?.process?.name}
                                </EuiLink>
                            </h2>
                        </EuiTitle>
                    </EuiFlyoutHeader>
                    <EuiFlyoutBody>
                        <EuiText>
                            {/*<DocDetails doc={command} item={command} indexPattern={dataSource?.indexPattern} />*/}
                        </EuiText>
                    </EuiFlyoutBody>
                </EuiFlyout>
            ) : null}
        </>

    );
}