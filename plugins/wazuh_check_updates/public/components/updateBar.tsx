import {
    EuiBottomBar,
    EuiButton,
    EuiCheckbox,
    EuiFlexGroup,
    EuiFlexItem,
    EuiHeaderLink,
    EuiText,
  } from '@elastic/eui';
  import React, { useState } from 'react';
  import { FormattedMessage } from '@osd/i18n/react';
  
  export interface UpdateBarProps {
    isVisible: boolean;
    onChangeVisible: (isVisible: boolean) => void;
  }
  
  export const UpdateBar = ({ isVisible, onChangeVisible }: UpdateBarProps) => {
    const [dismissFutureUpdates, setDismissFutureUpdates] = useState(false);
  
    const handleOnChangeDismiss = (checked: boolean) => {
      setDismissFutureUpdates(checked);
    };
  
    const handleOnClose = () => {
      onChangeVisible(false);
    };
  
    return isVisible ? (
      <EuiBottomBar style={{ backgroundColor: 'white', color: '#1a1c21' }}>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="m">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="m" alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiText>
                  <FormattedMessage
                    id="wazuhCheckUpdates.updatesBar.message"
                    defaultMessage="¡Wazuh 4.8.0 is available!"
                  />
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiHeaderLink
                  href={'https://documentation.wazuh.com/current/release-notes/release-4-5-1.html'}
                  isActive
                  target="_blank"
                >
                  {
                    <FormattedMessage
                      id="wazuhCheckUpdates.updatesBar.linkText"
                      defaultMessage="Go to the release notes for details"
                    />
                  }
                </EuiHeaderLink>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="m" alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiCheckbox
                  id="check-dismiss"
                  label={
                    <FormattedMessage
                      id="wazuhCheckUpdates.updatesBar.dismissCheckText"
                      defaultMessage="I don't want to know about future releases"
                    />
                  }
                  checked={dismissFutureUpdates}
                  onChange={(e) => handleOnChangeDismiss(e.target.checked)}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton size="s" iconType="cross" onClick={() => handleOnClose()}>
                  <FormattedMessage
                    id="wazuhCheckUpdates.updatesBar.closeButtonText"
                    defaultMessage="Close"
                  />
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiBottomBar>
    ) : null;
  };
  