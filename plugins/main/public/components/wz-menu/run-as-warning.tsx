import React, { useState } from 'react';
import { EuiHealth, EuiPopover, EuiText } from '@elastic/eui';

export const RunAsWarning = ({ run_as }: { run_as: boolean }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  return run_as === false ? (
    <div style={{ position: 'absolute', top: 17, right: 0 }}>
      <EuiPopover
        button={
          <EuiHealth
            color='warning'
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          ></EuiHealth>
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        repositionOnScroll={true}
      >
        <EuiText size='s'>
          <p>
            The selected API is configured with <b>run_as: false</b>, therefore
            user role-mapping is not applied.
          </p>
          <p>
            <a
              href='https://documentation.wazuh.com/current/user-manual/user-administration/rbac.html'
              target='_blank'
              rel='noopener noreferrer'
            >
              RBAC Documentation
            </a>
          </p>
        </EuiText>
      </EuiPopover>
    </div>
  ) : (
    <></>
  );
};
