import React, { Component, Fragment } from 'react';
import { EuiPage, EuiPageContent, EuiEmptyPrompt } from '@elastic/eui';
import { withErrorBoundary } from '../../common/hocs'
import { webDocumentationLink } from '../../../../common/services/web_documentation';
export const ClusterDisabled = withErrorBoundary (class ClusterDisabled extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <EuiEmptyPrompt
        iconType="iInCircle"
        title={
          <h2>
            {!this.props.enabled
              ? 'The cluster is disabled'
              : !this.props.running
              ? 'The cluster is not running'
              : ''}
          </h2>
        }
        body={
          <Fragment>
            {!this.props.enabled && (
              <p>
                Visit the documentation on{' '}
                <a href={webDocumentationLink('user-manual/configuring-cluster/index.html')}>
                  this link
                </a>{' '}
                to learn about how to enable it.
              </p>
            )}
            {!this.props.running && (
              <p>The cluster is enabled but it is not running.</p>
            )}
          </Fragment>
        }
      />
    );
  }
})
