import React from 'react';

import {
  EuiSpacer,
  EuiCode,
  EuiSteps,
  EuiText,
  EuiCodeBlock,
  EuiSubSteps,
  EuiButton,
  EuiButtonIcon,
  EuiPanel,
  EuiIcon,
  EuiAccordion,
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
          onClick: () => {

          },
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
          onClick: () => {

          },
        },
        {
          name: 'Use an app icon',
          icon: 'visualizeApp',
        },
        {
          name: 'Pass an icon as a component to customize it',
          icon: <EuiIcon type="trash" size="m" color="danger" />,
        },
        {
          name: 'Disabled option',
          icon: 'user',
          toolTipContent: 'For reasons, this item is disabled',
          toolTipPosition: 'right',
          disabled: true,
          onClick: () => {
            closePopover();
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
          onClick: () => {

          },
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
          <EuiFormRow label="Generate a public snapshot?" hasChildLabel={false}>
            <EuiSwitch
              name="switch"
              id="asdf"
              label="Snapshot data"
              checked={true}
              onChange={() => {}}
            />
          </EuiFormRow>
          <EuiFormRow
            label="Include the following in the embed"
            hasChildLabel={false}>
            <EuiSwitch
              name="switch"
              id="asdf2"
              label="Current time range"
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

const PopoverMenu = () => (
  <EuiPopover
      ownFocus={false}
      button={<EuiButtonIcon size="s" iconType="boxesVertical" />}
      isOpen={true}
      closePopover={()=>{}}
      initialFocus="[id=asdf2]">
      <EuiContextMenu initialPanelId={0} panels={panels} />
    </EuiPopover>
)

const steps = [
  {
    status: 'complete',
    title: 'Metadata',
    children: (
      <EuiPanel>
      <EuiAccordion
    id="accordionExtraWithLeftArrow"
    buttonContent="Metadata of the decoder"
    extraAction={<PopoverMenu/>}
    paddingSize="l">
    <EuiText>
          <p>Run this code snippet to install things.</p>
        </EuiText>
        <EuiSpacer />
        <EuiCodeBlock language="bash">npm install</EuiCodeBlock>
  </EuiAccordion>

      </EuiPanel>
    ),
  },
  {
    status: 'incomplete',
    title: 'Checks',
    children: (
      <EuiText>
        <p>
          In order to complete this step, do the following things{' '}
          <strong>in order</strong>.
        </p>
        <EuiSubSteps>
          <ol>
            <li>Do thing 1</li>
            <li>Do thing 2</li>
            <li>Do thing 3</li>
          </ol>
        </EuiSubSteps>
        <p>Here are some bullet point reminders.</p>
        <ul>
          <li>Reminder 1</li>
          <li>Reminder 2</li>
          <li>Reminder 3</li>
        </ul>
      </EuiText>
    ),
  },
  {
    status: 'danger',
    title: 'Normalize',
    children: (
      <EuiText>
        <p>
          Now that you&apos;ve completed step 2, go find the{' '}
          <EuiCode>thing</EuiCode>.
        </p>
        <p>
          Go to <strong>Overview &gt;&gt; Endpoints</strong> note{' '}
          <strong>OpenSearch</strong> as <EuiCode>&lt;thing&gt;</EuiCode>.
        </p>
      </EuiText>
    ),
  },
];

export const Steps = () => (
  <div>
    <EuiSteps headingElement="h2" steps={steps} />
  </div>
);
