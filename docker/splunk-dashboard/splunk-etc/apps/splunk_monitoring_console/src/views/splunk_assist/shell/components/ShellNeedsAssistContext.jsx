import PropTypes from 'prop-types';
import React from 'react';
import { useAssistContext } from '../../common/hooks/AssistContextProvider';
import { RemoteConfigProvider } from '../../common/hooks/RemoteConfigProvider';
import ErrorPage from '../../error/components/ErrorPage/ErrorPage';
import ConnectivityBlockedCard from '../../onboarding/components/ConnectivityBlockedCard';
import ConnectivityBlockedPage from '../../onboarding/components/ConnectivityBlockedPage/ConnectivityBlockedPage';
import FipsPage from '../../onboarding/components/FipsPage/FipsPage';
import Onboarding from '../../onboarding/components/Onboarding';
import SudOffCard from '../../onboarding/components/SudOffCard';
import Loading from './Loading';
import { ShellNeedsRemoteConfigContext } from './ShellNeedsRemoteConfigContext';
import Wrapper from './Wrapper';

const EnableSUD = ({ handleRefresh }) => {
    return (
        <Wrapper>
            <Onboarding instructionsCard={<SudOffCard handleRefresh={handleRefresh} />} instructionsCardHeight={340} />
        </Wrapper>
    );
};

EnableSUD.propTypes = {
    handleRefresh: PropTypes.func.isRequired,
};

const UnblockConnectivity = ({ handleRefresh }) => (
    <Wrapper>
        <Onboarding
            instructionsCard={<ConnectivityBlockedCard handleRefresh={handleRefresh} />}
            instructionsCardHeight={350}
        />
    </Wrapper>
);

UnblockConnectivity.propTypes = {
    handleRefresh: PropTypes.func.isRequired,
};

export const ShellNeedsAssistContext = () => {
    const { error, isLoading, statuses, refresh } = useAssistContext();

    if (error) {
        return <ErrorPage dataTest="assist-context-error" />;
    }

    if (isLoading) {
        return <Loading />;
    }

    if (statuses.isFipsEnabled) {
        return (
            <Wrapper>
                <FipsPage />
            </Wrapper>
        );
    }

    if (!statuses.isSUDEnabled) {
        return <EnableSUD handleRefresh={refresh} />;
    }

    if (!statuses.isConnectivityOpen) {
        if (!statuses.isAssistEnabled) {
            return <UnblockConnectivity handleRefresh={refresh} />;
        }

        return (
            <Wrapper>
                <ConnectivityBlockedPage />
            </Wrapper>
        );
    }

    return (
        <RemoteConfigProvider>
            <ShellNeedsRemoteConfigContext />
        </RemoteConfigProvider>
    );
};
