import React from 'react';
import { EuiFlexItem, EuiToolTip, EuiButtonEmpty, EuiIcon } from '@elastic/eui';
import { getWazuhCorePlugin } from '../../../kibana-services';

export const CheckUpdatesButton = ({
  isUpdatesEnabled,
  availableUpdates,
  getApisAvailableUpdates,
}) =>
  isUpdatesEnabled ? (
    <EuiFlexItem grow={false}>
      <EuiButtonEmpty
        iconType='refresh'
        onClick={async () => await getApisAvailableUpdates(true, true)}
      >
        <span>
          Check updates{' '}
          <EuiToolTip
            title='Last dashboard check'
            content={
              availableUpdates?.last_check_date
                ? getWazuhCorePlugin().utils.formatUIDate(
                    availableUpdates.last_check_date,
                  )
                : '-'
            }
          >
            <EuiIcon type='iInCircle' color='primary' />
          </EuiToolTip>
        </span>
      </EuiButtonEmpty>
    </EuiFlexItem>
  ) : (
    <></>
  );
