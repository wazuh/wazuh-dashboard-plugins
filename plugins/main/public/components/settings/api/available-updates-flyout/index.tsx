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
import { AvailableUpdates } from '../../../../../../wazuh-check-updates/common/types';
import { UpdateDetail } from './update-detail';
import { WzFlyout } from '../../../../components/common/flyouts';

interface AvailableUpdatesFlyoutProps {
  updates: AvailableUpdates;
  isVisible: boolean;
  onClose: () => void;
}

export const AvailableUpdatesFlyout = ({
  updates,
}: AvailableUpdatesFlyoutProps) => {
  return (
    <>
      <EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <EuiDescriptionList
            listItems={[
              {
                title: 'Version',
                description: updates.current_version as string,
              },
            ]}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <UpdateDetail
        update={updates.last_available_major || {}}
        type='Last available major'
      />
      <UpdateDetail
        update={updates.last_available_minor || {}}
        type='Last available minor'
      />
      <UpdateDetail
        update={updates.last_available_patch || {}}
        type='Last available patch'
      />
    </>
  );
};
