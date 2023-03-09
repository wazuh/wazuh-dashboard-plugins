import PropTypes from 'prop-types';
import React, { createContext, useContext } from 'react';
import { isLoadingState, useLoadAsync } from '../../providers/useLoadAsync';
import loadRemoteConfigs from '../../common/config/remoteConfig';

export const RemoteConfigContext = createContext(null);
RemoteConfigContext.displayName = 'RemoteConfigContext';

export const RemoteConfigProvider = ({ children }) => {
    const result = useLoadAsync(loadRemoteConfigs);

    return (
        <RemoteConfigContext.Provider
            value={{
                error: result.error,
                isLoading: isLoadingState(result.loadingState),
                remoteConfigs: result.value,
            }}
        >
            {children}
        </RemoteConfigContext.Provider>
    );
};

RemoteConfigProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

/**
 *
 * @returns {{
 * error: string | undefined;
 * isLoading: boolean;
 * remoteConfigs: [{id: string, remoteRoot: string}] | undefined;
 * }}
 */
export const useRemoteConfigs = () => {
    const context = useContext(RemoteConfigContext);
    if (!context) {
        throw new Error('useRemoteConfigs must be called inside a Provider with a value');
    }
    return context;
};
