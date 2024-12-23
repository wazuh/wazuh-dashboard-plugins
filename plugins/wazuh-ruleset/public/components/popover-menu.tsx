import React, { useState } from 'react';
import {
  EuiSpacer,
  EuiButton,
  EuiButtonIcon,
  EuiIcon,
  EuiPopover,
  EuiContextMenu,
  EuiSwitch,
  EuiFormRow,
} from '@elastic/eui';

const panels = [
  {
    id: 0,
    title: 'This is a context menu',
    items: [
      {
        name: 'Handle an onClick',
        icon: 'search',
        onClick: () => {},
      },
      {
        name: 'Go to a link',
        icon: 'user',
        href: 'http://elastic.co',
        target: '_blank',
      },
      {
        name: 'Nest panels',
        icon: 'wrench',
        panel: 1,
      },
      {
        name: 'Add a tooltip',
        icon: 'document',
        toolTipTitle: 'Optional tooltip',
        toolTipContent: 'Optional content for a tooltip',
        toolTipPosition: 'right',
        onClick: () => {},
      },
      {
        name: 'Use an app icon',
        icon: 'visualizeApp',
      },
      {
        name: 'Pass an icon as a component to customize it',
        icon: <EuiIcon type='trash' size='m' color='danger' />,
      },
      {
        name: 'Disabled option',
        icon: 'user',
        toolTipContent: 'For reasons, this item is disabled',
        toolTipPosition: 'right',
        disabled: true,
        onClick: () => {
          // closePopover();
        },
      },
    ],
  },
  {
    id: 1,
    initialFocusedItemIndex: 1,
    title: 'Nest panels',
    items: [
      {
        name: 'PDF reports',
        icon: 'user',
        onClick: () => {},
      },
      {
        name: 'Embed code',
        icon: 'user',
        panel: 2,
      },
      {
        name: 'Permalinks',
        icon: 'user',
        onClick: () => {
          // closePopover();
        },
      },
    ],
  },
  {
    id: 2,
    title: 'Embed code',
    content: (
      <div style={{ padding: 16 }}>
        <EuiFormRow label='Generate a public snapshot?' hasChildLabel={false}>
          <EuiSwitch
            name='switch'
            id='asdf'
            label='Snapshot data'
            checked={true}
            onChange={() => {}}
          />
        </EuiFormRow>
        <EuiFormRow
          label='Include the following in the embed'
          hasChildLabel={false}
        >
          <EuiSwitch
            name='switch'
            id='asdf2'
            label='Current time range'
            checked={true}
            onChange={() => {}}
          />
        </EuiFormRow>
        <EuiSpacer />
        <EuiButton fill>Copy iFrame code</EuiButton>
      </div>
    ),
  },
];

export const PopoverMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <EuiPopover
      ownFocus={false}
      button={
        <EuiButtonIcon
          aria-label='Actions'
          size='s'
          iconType='boxesVertical'
          onClick={() => setIsOpen(!isOpen)}
        />
      }
      isOpen={isOpen}
      closePopover={() => {}}
      initialFocus='[id=asdf2]'
    >
      <EuiContextMenu initialPanelId={0} panels={panels} />
    </EuiPopover>
  );
};
