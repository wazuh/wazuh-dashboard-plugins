import { i18n } from '@osd/i18n';
import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiLink,
  EuiText,
} from '@elastic/eui';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../../kibana-services';
import NavigationService from '../../../../react-services/navigation-service';

interface DocDetailsHeaderProps {
  doc?: { _id?: string; _index?: string };
  indexPattern?: { id?: string };
  title?: string;
}

const DocDetailsHeader = ({
  doc,
  indexPattern,
  title = i18n.translate('wazuh.common.wazuhDiscover.documentDetailsTitle', {
    defaultMessage: 'Document Details',
  }),
}: DocDetailsHeaderProps) => {
  return (
    // Right padding keeps the links clear of the flyout close button.
    <EuiFlexGroup
      alignItems='center'
      gutterSize='s'
      responsive={false}
      style={{ paddingRight: '24px' }}
    >
      <EuiFlexItem grow={false}>
        <EuiTitle>
          <h2>{title}</h2>
        </EuiTitle>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiText size='s'>
          <EuiFlexGroup
            direction='column'
            alignItems='flexEnd'
            gutterSize='xs'
            responsive={false}
            style={{ whiteSpace: 'nowrap' }}
          >
            <EuiFlexItem grow={false}>
              <RedirectAppLinks application={getCore().application}>
                <EuiLink
                  href={NavigationService.getInstance().getUrlForApp(
                    'discover',
                    {
                      path: `#/context/${indexPattern?.id}/${doc?._id}`,
                    },
                  )}
                  target='_blank'
                  rel='noopener noreferrer'
                  external
                >
                  {i18n.translate(
                    'wazuh.common.wazuhDiscover.viewSurroundingDocumentsLink',
                    { defaultMessage: 'View surrounding documents' },
                  )}
                </EuiLink>
              </RedirectAppLinks>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <RedirectAppLinks application={getCore().application}>
                <EuiLink
                  href={NavigationService.getInstance().getUrlForApp(
                    'discover',
                    {
                      path: `#/doc/${indexPattern?.id}/${doc?._index}?id=${doc?._id}`,
                    },
                  )}
                  target='_blank'
                  rel='noopener noreferrer'
                  external
                >
                  {i18n.translate(
                    'wazuh.common.wazuhDiscover.viewSingleDocumentLink',
                    { defaultMessage: 'View single document' },
                  )}
                </EuiLink>
              </RedirectAppLinks>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export default DocDetailsHeader;
