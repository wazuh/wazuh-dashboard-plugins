import React from 'react';
import { EuiFlyout, EuiFlyoutHeader, EuiFlyoutBody, EuiTitle, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import DocDetailsHeader from './doc-details-header';
import { DocumentViewTableAndJson } from './document-view-table-and-json';
import { IndexPattern } from '../../../../../../../../src/plugins/data/common';

/**
 * Interface for DocumentFlyout component properties
 * @interface DocumentFlyoutProps
 */
interface DocumentFlyoutProps {
  /** Document or hit to be displayed in detail */
  hit: any;
  /** Function to close the flyout */
  onClose: () => void;
  /** Index pattern associated with the data */
  indexPattern: IndexPattern;
  /** Custom fields to render in the view */
  renderFields?: Array<{
    render: boolean;
    [key: string]: any;
  }>;
}

/**
 * Component that displays a flyout with document details
 *
 * @param {DocumentFlyoutProps} props - Component properties
 * @returns {React.ReactElement} DocumentFlyout Component
 */
export const DocumentFlyout: React.FC<DocumentFlyoutProps> = ({ hit, onClose, indexPattern, renderFields }) => (
  <EuiFlyout onClose={onClose} size='m'>
    <EuiFlyoutHeader>
      <EuiTitle>
        <DocDetailsHeader/>
      </EuiTitle>
    </EuiFlyoutHeader>
    <EuiFlyoutBody>
      <EuiFlexGroup direction='column'>
        <EuiFlexItem>
          <DocumentViewTableAndJson
            document={hit}
            indexPattern={indexPattern}
            renderFields={renderFields}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFlyoutBody>
  </EuiFlyout>
);
