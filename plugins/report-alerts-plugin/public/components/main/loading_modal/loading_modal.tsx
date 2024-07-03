/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiOverlayMask,
  EuiModal,
  EuiModalHeader,
  EuiTitle,
  EuiText,
  EuiModalBody,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiButton,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useState } from 'react';

export function GenerateReportLoadingModal(props: { setShowLoading: any }) {
  const { setShowLoading } = props;

  const [isModalVisible, setIsModalVisible] = useState(true);

  const closeModal = () => {
    setIsModalVisible(false);
    setShowLoading(false);
  };
  const showModal = () => setIsModalVisible(true);

  return (
    <div>
      <EuiOverlayMask>
        <EuiModal
          onClose={closeModal}
          style={{ maxWidth: 350, minWidth: 300 }}
          id="downloadInProgressLoadingModal"
        >
          <EuiModalHeader>
            <EuiTitle>
              <EuiText textAlign="right">
                <h2>
                  {i18n.translate(
                    'opensearch.reports.loading.generatingReport',
                    { defaultMessage: 'Generating report' }
                  )}
                </h2>
              </EuiText>
            </EuiTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <EuiText>
              {i18n.translate('opensearch.reports.loading.preparingYourFile', {
                defaultMessage: 'Preparing your file for download.',
              })}
            </EuiText>
            <EuiText>
              {i18n.translate('opensearch.reports.loading.youCanClose', {
                defaultMessage:
                  'Please keep this dialog open while report is being generated.',
              })}
            </EuiText>
            <EuiSpacer />
            <EuiFlexGroup justifyContent="center" alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiLoadingSpinner
                  size="xl"
                  style={{ minWidth: 75, minHeight: 75 }}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="l" />
          </EuiModalBody>
        </EuiModal>
      </EuiOverlayMask>
    </div>
  );
}
