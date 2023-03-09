import React from 'react';
import { useRemoteConfigs } from '../../common/hooks/RemoteConfigProvider';
import ErrorPage from '../../error/components/ErrorPage/ErrorPage';
import Loading from './Loading';
import RemoteLoadingShell from './RemoteLoadingShell';

export const ShellNeedsRemoteConfigContext = () => {
    const { error, isLoading, remoteConfigs } = useRemoteConfigs();
    if (error) {
        return <ErrorPage dataTest="assist-context-error" />;
    }
    if (isLoading) {
        return <Loading />;
    }

    return <RemoteLoadingShell remoteConfigs={remoteConfigs} />;
};
