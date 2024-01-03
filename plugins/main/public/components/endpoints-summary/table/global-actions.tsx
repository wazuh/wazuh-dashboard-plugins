import React, { useState } from 'react';

import {
  EuiContextMenuPanel,
  OuiContextMenuItem,
  EuiPopover,
  EuiButtonEmpty,
} from '@elastic/eui';
import { WzElementPermissions } from '../../common/permissions/element';

export interface AgentsTableGlobalActionsProps {
  agents: any[];
  allowEditGroups: boolean;
}

export const AgentsTableGlobalActions = ({
  agents,
  allowEditGroups,
}: AgentsTableGlobalActionsProps) => {
  const [isPopoverOpen, setPopover] = useState(false);
  console.log({ agents });
  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const items = [
    <OuiContextMenuItem
      key='group'
      icon='pencil'
      onClick={closePopover}
      disabled={!agents?.length || !allowEditGroups}
    >
      <WzElementPermissions
        permissions={[
          {
            action: 'group:modify_assignments',
            resource: 'group:id:*',
          },
        ]}
      >
        <span>Assing/create group</span>
      </WzElementPermissions>
    </OuiContextMenuItem>,
  ];

  const button = (
    <EuiButtonEmpty
      iconType='arrowDown'
      iconSide='right'
      onClick={onButtonClick}
    >
      Other actions
    </EuiButtonEmpty>
  );

  return (
    <EuiPopover
      id='agentsTableGlobalActions'
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize='none'
      anchorPosition='downRight'
    >
      <EuiContextMenuPanel items={items} />
    </EuiPopover>
  );
};
