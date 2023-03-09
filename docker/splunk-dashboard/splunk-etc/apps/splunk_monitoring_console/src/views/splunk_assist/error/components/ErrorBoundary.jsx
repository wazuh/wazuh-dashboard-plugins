import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ErrorPage from './ErrorPage/ErrorPage';

class ErrorBoundary extends Component {
    static getDerivedStateFromError() {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    constructor(props) {
        super(props);
        this.state = { hasError: null };
    }

    render() {
        const { children } = this.props;
        const { hasError } = this.state;
        if (hasError) {
            return <ErrorPage dataTest="error-boundary-error" />;
        }
        return children;
    }
}

ErrorBoundary.propTypes = {
    /**
     * Arbitrary children. Any errors thrown in the children
     * tree will be caught by this `ErrorBoundary`.
     */
    children: PropTypes.node.isRequired,
};
export default ErrorBoundary;
