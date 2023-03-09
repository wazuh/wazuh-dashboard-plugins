import React from 'react';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';
import { AssistContextProvider } from '../../common/hooks/AssistContextProvider';
import ErrorBoundary from '../../error/components/ErrorBoundary';
import { ShellNeedsAssistContext } from './ShellNeedsAssistContext';

const SplunkAssistShell = () => (
    <SplunkThemeProvider family="prisma" colorScheme="dark" density="comfortable">
        <ErrorBoundary data-test="error-bound">
            <AssistContextProvider>
                <ShellNeedsAssistContext />
            </AssistContextProvider>
        </ErrorBoundary>
    </SplunkThemeProvider>
);

export default SplunkAssistShell;
