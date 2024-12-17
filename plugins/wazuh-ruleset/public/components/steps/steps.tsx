import React from 'react';
import {
  EuiCode,
  EuiSteps,
  EuiText,
  EuiSubSteps,
  EuiPanel,
  EuiAccordion,
} from '@elastic/eui';
import { PopoverMenu } from '../popover-menu';
import mockDecoders from '../../../common/__mocks__/decoders';
import { Settings } from './setting';

const steps = [
  {
    status: 'complete',
    title: 'Metadata',
    children: (
      <EuiPanel>
        <EuiAccordion
          id='accordionExtraWithLeftArrow'
          buttonContent='Metadata of the decoder'
          extraAction={<PopoverMenu />}
          paddingSize='l'
        >
          <Settings step={mockDecoders[1].metadata} />
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
    <EuiSteps headingElement='h2' steps={steps} />
  </div>
);
