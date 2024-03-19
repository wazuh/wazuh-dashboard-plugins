import React from 'react';
import {
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyoutBody,
  EuiDescriptionList,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { ApiAvailableUpdates } from '../../../../../../wazuh-check-updates/common/types';
import { UpdateDetail } from './update-detail';
import { WzFlyout } from '../../../../components/common/flyouts';

interface AvailableUpdatesFlyoutProps {
  api: ApiAvailableUpdates;
  isVisible: boolean;
  onClose: () => void;
}

export const AvailableUpdatesFlyout = ({
  api,
}: AvailableUpdatesFlyoutProps) => {
  return (
    <>
      <EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <EuiDescriptionList
            listItems={[
              {
                title: 'API ID',
                description: api.api_id,
              },
            ]}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiDescriptionList
            listItems={[
              {
                title: 'Version',
                description: api.current_version as string,
              },
            ]}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <UpdateDetail
        update={api.last_available_major || {}}
        type='Last available major'
      />
      <UpdateDetail
        update={api.last_available_minor || {}}
        type='Last available minor'
      />
      <UpdateDetail
        update={api.last_available_patch || {}}
        type='Last available patch'
      />
    </>
  );
};
