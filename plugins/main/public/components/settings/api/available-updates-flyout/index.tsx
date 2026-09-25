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
import { i18n } from '@osd/i18n';
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
                title: i18n.translate(
                  'wazuh.dashboardsSettings.availableUpdatesFlyout.currentVersionTitle',
                  { defaultMessage: 'Version' },
                ),
                description: updates.current_version as string,
              },
            ]}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <UpdateDetail
        update={updates.last_available_major || {}}
        type={i18n.translate(
          'wazuh.dashboardsSettings.availableUpdatesFlyout.lastAvailableMajor',
          { defaultMessage: 'Last available major' },
        )}
      />
      <UpdateDetail
        update={updates.last_available_minor || {}}
        type={i18n.translate(
          'wazuh.dashboardsSettings.availableUpdatesFlyout.lastAvailableMinor',
          { defaultMessage: 'Last available minor' },
        )}
      />
      <UpdateDetail
        update={updates.last_available_patch || {}}
        type={i18n.translate(
          'wazuh.dashboardsSettings.availableUpdatesFlyout.lastAvailablePatch',
          { defaultMessage: 'Last available patch' },
        )}
      />
    </>
  );
};
