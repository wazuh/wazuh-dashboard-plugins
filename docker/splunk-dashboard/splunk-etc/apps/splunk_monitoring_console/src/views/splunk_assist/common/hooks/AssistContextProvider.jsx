import PropTypes from 'prop-types';
import React, { createContext, useContext } from 'react';
import { isLoadingState, useLoadAsync } from '../../providers/useLoadAsync';
import SupervisorService from '../services/SupervisorService';

export const AssistContext = createContext(null);
AssistContext.displayName = 'AssistContext';

export const AssistContextProvider = ({ children }) => {
    const supervisorResult = useLoadAsync(SupervisorService.getStatus);
    return (
        <AssistContext.Provider
            value={{
                error: supervisorResult.error,
                statuses: {
                    isConnectivityOpen: supervisorResult.value ? supervisorResult.value.isConnectivityOpen : null,
                    isAssistEnabled: supervisorResult.value ? supervisorResult.value.isAssistEnabled : null,
                    isSUDEnabled: supervisorResult.value ? supervisorResult.value.isSUDEnabled : null,
                    isFipsEnabled: supervisorResult.value ? supervisorResult.value.isFipsEnabled : null,
                },
                isLoading: isLoadingState(supervisorResult.loadingState),
                refresh: supervisorResult.refresh,
            }}
        >
            {children}
        </AssistContext.Provider>
    );
};

AssistContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

/**
 *
 * @returns {{
 * error: string | undefined;
 * statuses: {
 *     isConnectivityOpen: boolean;
 *     isSUDEnabled: boolean;
 *     isAssistEnabled: boolean;
 *     isFipsEnabled: boolean;
 * };
 * isLoading: boolean;
 * refresh: () => void;
 * }}
 */
export const useAssistContext = () => {
    const context = useContext(AssistContext);
    if (!context) {
        throw new Error('useAssistContext must be called inside a Provider with a value');
    }
    return context;
};
