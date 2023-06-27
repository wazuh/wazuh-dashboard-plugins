import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiLink, EuiPopover } from "@elastic/eui"
import React, { useState } from "react";
import { webDocumentationLink } from "../../../../../common/services/web_documentation";
import { PLUGIN_VERSION_SHORT } from "../../../../../common/constants";

const ServerAddressTitle = () => {
    const [isPopoverServerAddress, setIsPopoverServerAddress] = useState(false);
    const closeServerAddress = () => setIsPopoverServerAddress(false);
    const onButtonServerAddress = () =>
    setIsPopoverServerAddress(
      isPopoverServerAddress => !isPopoverServerAddress,
    );

    const popoverServerAddress = (
      <span>
        Learn about{' '}
        <EuiLink
          href={webDocumentationLink(
            'user-manual/reference/ossec-conf/client.html#groups',
            PLUGIN_VERSION_SHORT,
          )}
          target='_blank'
          rel='noopener noreferrer'
        >
          Server address.
        </EuiLink>
      </span>
    );

    return (<EuiFlexGroup>
    <EuiFlexItem grow={false}>
      <EuiPopover
        button={
          <EuiButtonEmpty
            iconType='questionInCircle'
            iconSide='right'
            onClick={onButtonServerAddress}
            className='stepTitle'
          >
            Server address
          </EuiButtonEmpty>
        }
        isOpen={isPopoverServerAddress}
        closePopover={closeServerAddress}
        anchorPosition='rightCenter'
      >
        {popoverServerAddress}
      </EuiPopover>
    </EuiFlexItem>
  </EuiFlexGroup>)
}

export default ServerAddressTitle;