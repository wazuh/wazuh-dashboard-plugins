import { useRemotes } from '@splunk/skinny-bundle-loader';
import { ThemeUtils } from '@splunk/swc-mc';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import * as ReactRouterDOM from 'react-router-dom';
import * as StyledComponents from 'styled-components';
import { USE_MOCK_DATA } from '../../common/constants';
import ErrorPage from '../../error/components/ErrorPage/ErrorPage';
import Loading from './Loading';

const singletonLibs = {
    react: React,
    'react-dom': ReactDOM,
    'react-router-dom': ReactRouterDOM,
    'styled-components': StyledComponents,
};

/**
 *
 * @param {*} props
 * @returns A component that loads a remote, based on the config passed in as props, and then renders
 * the remote.
 */
const RemoteLoadingShell = (props) => {
    const { remoteAndManifests, loading, error } = useRemotes(props.remoteConfigs, singletonLibs);

    if (loading) {
        return <Loading data-test-name="remote-shell-loading-message" />;
    }

    if (!remoteAndManifests || remoteAndManifests.length === 0 || error) {
        if (error != null) {
            // eslint-disable-next-line no-restricted-globals
            console.log(error);
        }
        return <ErrorPage dataTest="remote-loading-shell-error" />;
    }

    const theme = ThemeUtils.getCurrentTheme();
    const themeColorScheme = theme ? theme.colorScheme : 'light';
    const { remote } = remoteAndManifests[0];
    const { components } = remote;
    const context = {
        isSE: true,
        themeColorScheme,
    };

    return <components.root context={context} isTest={USE_MOCK_DATA} />;
};

RemoteLoadingShell.propTypes = {
    remoteConfigs: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            remoteRoot: PropTypes.string.isRequired,
        })
    ).isRequired,
};

export default RemoteLoadingShell;
