import React, { Component, Fragment } from 'react';
import { EuiPage, EuiPageContent, EuiEmptyPrompt } from '@elastic/eui';
import { withErrorBoundary } from '../../common/hocs'
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { i18n } from '@kbn/i18n';
const description1 = i18n.translate("wazuh.components.management.cluster.Descp1", {
	defaultMessage: "'The cluster is disabled'",
});
const description2 = i18n.translate("wazuh.components.management.cluster.Descp2", {
	defaultMessage: "The cluster is not running",
});
export const ClusterDisabled = withErrorBoundary (class ClusterDisabled extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
      <EuiEmptyPrompt
        iconType='iInCircle'
        title={
          <h2>
            {!this.props.enabled
              ? description1
              : !this.props.running
              ? description2 : ''}
          </h2>
        }
        body={
          <Fragment>
            {!this.props.enabled && (
              <p>
                {i18n.translate('wazuh.components.manage.cluster.visit on', {
                  defaultMessage: 'Visit the documentation on',
                })}{' '}
                <a
                  href={webDocumentationLink(
                    'user-manual/configuring-cluster/index.html',
                  )}
                >
                  this link
                </a>{' '}
                {i18n.translate('wazuh.components.manage.cluster.enableit', {
                  defaultMessage: 'to learn about how to enable it.',
                })}
              </p>
            )}
            {!this.props.running && (
              <p>
                {i18n.translate('wazuh.components.manage.cluster.running', {
                  defaultMessage:
                    'The cluster is enabled but it is not running.',
                })}
              </p>
            )}
          </Fragment>
        }
      />
    );
	}
})
