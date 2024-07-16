import React from 'react';
import {
    EuiFlexGroup,
    EuiFlexItem,
    EuiTitle,
    EuiLink,
} from '@elastic/eui';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../../kibana-services';

const DocDetailsHeader = ({ doc, indexPattern }) => {
    return (<EuiFlexGroup>
        <EuiFlexItem>
            <EuiTitle>
                <h2>Document Details</h2>
            </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem>
            <EuiFlexGroup>
                <EuiFlexItem>
                    <RedirectAppLinks application={getCore().application}>
                        <EuiLink
                            href={getCore().application.getUrlForApp('discover', {
                                path: `#/context/${indexPattern?.id}/${doc?._id}`,
                            })}
                            target='_blank'
                            rel='noopener noreferrer'
                            external
                        >
                            View surrounding documents
                        </EuiLink>
                    </RedirectAppLinks>
                </EuiFlexItem>
                <EuiFlexItem>
                    <RedirectAppLinks application={getCore().application}>
                        <EuiLink
                            href={getCore().application.getUrlForApp('discover', {
                                path: `#/doc/${indexPattern?.id}/${doc?._index}?id=${doc?._id}`,
                            })}
                            target='_blank'
                            rel='noopener noreferrer'
                            external
                        >
                            View single document
                        </EuiLink>
                    </RedirectAppLinks>
                </EuiFlexItem>
            </EuiFlexGroup>
        </EuiFlexItem>
    </EuiFlexGroup>);

}

export default DocDetailsHeader;