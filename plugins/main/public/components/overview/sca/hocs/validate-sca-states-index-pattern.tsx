/**
 * @fileoverview This file provides a Higher Order Component (HOC) to validate
 * and manage index patterns related to Security Configuration Assessment (SCA)
 * in Wazuh Dashboard.
 * @module components/agents/sca/hocs/validate-sca-states-index-pattern
 */

import React from 'react';
import { EuiLink } from '@elastic/eui';
import { WAZUH_SCA_PATTERN } from '../../../../../common/constants';
import {
  ensureIndexPatternIsCreated,
  ERROR_NO_INDICES_FOUND,
  withIndexPatternFromValue,
  withMapErrorPromptErrorEnsureIndexPattern,
} from '../../../common/hocs/with-index-pattern';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';

/**
 * @typedef {Object} ErrorPromptType
 * @property {Function} title - Function that returns the error message title
 * @property {Function} body - Function that returns the error message body as a React component
 */

/**
 * Definition of error message types that will be shown to the user
 * when problems occur with index patterns.
 * @type {Object.<string, ErrorPromptType>}
 */
const errorPromptTypes = {
  [ERROR_NO_INDICES_FOUND]: {
    title: () => 'Configuration Assessment could be disabled or has a problem',
    body: ({ message }: { message: React.ReactNode }) => (
      <>
        <p>{message}</p>
        <p>
          If the Configuration Assessment is enabled, then this could be caused
          by an error in: server side, server-indexer connection, indexer side,
          index creation, index data, index pattern name misconfiguration or
          user permissions related to read the inventory indices.
        </p>
        <p>
          Please, review the server and indexer logs. Also, you can check the{' '}
          <EuiLink
            href={webDocumentationLink(
              'user-manual/capabilities/sec-config-assessment/index.html',
            )}
            target='_blank'
            rel='noopener noreferrer'
            external
          >
            Configuration assessment documentation.
          </EuiLink>
        </p>
      </>
    ),
  },
  default: {
    title: ({ title }: { title: string }) => title,
    body: ({ message }) => <p>{message}</p>,
  },
};

/**
 * HOC that provides validation for the SCA index pattern.
 * Ensures that the index pattern exists for SCA functionality
 * is properly configured before displaying related data.
 *
 * @example
 * // Component that displays SCA data
 * const SCAComponent = ({ data }) => {
 *   // Component rendering
 * };
 *
 * // Component wrapped with index pattern validation
 * const SCAComponentWithDataSource = withSCADataSource(SCAComponent);
 *
 * // Usage in application
 * <SCAComponentWithDataSource />
 *
 * @function
 * @param {React.ComponentType} Component - The component to wrap
 * @returns {React.ComponentType} Component wrapped with index pattern validation
 */
export const withSCADataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_SCA_PATTERN,
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  validate: ensureIndexPatternIsCreated(),
});
