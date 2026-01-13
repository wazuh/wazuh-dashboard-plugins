import React, { useState } from 'react';
import { EuiHealth, EuiPopover, EuiText, EuiLink } from '@elastic/eui';
import { webDocumentationLink } from '../../../common/services/web_documentation';

export const RunAsWarning = ({
  run_as,
  style,
}: {
  run_as: boolean;
  style?: React.CSSProperties;
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  return run_as === false ? (
    <div style={style}>
      <EuiPopover
        button={
          <EuiHealth
            color='warning'
            style={{ cursor: 'pointer' }}
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
            <EuiLink
              href={webDocumentationLink(
                'user-manual/user-administration/rbac.html',
              )}
              target='_blank'
              external
              rel='noopener noreferrer'
            >
              RBAC Documentation
            </EuiLink>
          </p>
        </EuiText>
      </EuiPopover>
    </div>
  ) : (
    <></>
  );
};
