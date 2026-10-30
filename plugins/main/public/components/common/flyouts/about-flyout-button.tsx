/*
 * Wazuh app - About flyout button shared by the module pages
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState } from 'react';
import {
  EuiButtonEmpty,
  EuiCode,
  EuiDescriptionList,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { webDocumentationLink } from '../../../../common/services/web_documentation';

/**
 * Link to a page of the Wazuh documentation that opens in a new tab.
 */
export const AboutFlyoutDocsLink = ({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) => (
  <EuiLink
    href={webDocumentationLink(path)}
    target='_blank'
    rel='noopener noreferrer'
    external
  >
    {children}
  </EuiLink>
);

export interface AboutFlyoutTerm {
  title: NonNullable<React.ReactNode>;
  description: NonNullable<React.ReactNode>;
}

export interface AboutFlyoutSectionDefinition {
  /** Heading of the section. */
  title: string;
  content: React.ReactNode;
}

/**
 * Titled section of the flyout body: an h3 heading followed by its content.
 */
export const AboutFlyoutSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <>
    <EuiSpacer size='m' />
    <EuiTitle size='xs'>
      <h3>{title}</h3>
    </EuiTitle>
    <EuiSpacer size='s' />
    {children}
  </>
);

/** Definitions of the terms of a module, in the format shared by all the flyouts. */
export const AboutFlyoutTerms = ({ terms }: { terms: AboutFlyoutTerm[] }) => (
  <EuiDescriptionList compressed listItems={terms} />
);

export interface AboutFlyoutIndex {
  /** Id used in the test id of the item: wzAbout<testSubj>Index-<id>. */
  id: string;
  /** Name of the tab that reads the indices, as it is shown in the UI. */
  tab: string;
  /** Index patterns that the tab reads. */
  patterns: string[];
}

/** Index patterns that each tab of a module reads, in the format shared by all the flyouts. */
const AboutFlyoutIndices = ({
  testSubj,
  indices,
}: {
  testSubj: string;
  indices: AboutFlyoutIndex[];
}) => (
  <>
    <EuiText size='s'>
      <p>
        {i18n.translate('wazuh.common.aboutFlyout.indicesDescription', {
          defaultMessage: 'The index patterns that each tab reads.',
        })}
      </p>
    </EuiText>
    <EuiSpacer size='s' />
    <EuiDescriptionList
      compressed
      listItems={indices.map(({ id, tab, patterns }) => ({
        title: tab,
        description: patterns.map(pattern => (
          <div key={pattern}>
            <EuiCode data-test-subj={`wzAbout${testSubj}Index-${id}`}>
              {pattern}
            </EuiCode>
          </div>
        )),
      }))}
    />
  </>
);

interface AboutFlyoutButtonProps {
  /** Label of the button and title of the flyout. */
  title: string;
  /** Suffix of the test ids: wzAbout<testSubj>Button and wzAbout<testSubj>Flyout. */
  testSubj: string;
  /** Path of the module page in the Wazuh documentation. */
  docsPath: string;
  /** What the module is and what it reports. Paragraphs are rendered in small text. */
  overview: React.ReactNode;
  /** What the data and the terms of the module mean. */
  terms?: AboutFlyoutTerm[];
  /** Extra sections rendered after the terms, with the same heading style. */
  extraSections?: AboutFlyoutSectionDefinition[];
  /** Index patterns that the module reads and the tab that reads each one. */
  indices?: AboutFlyoutIndex[];
  /** Where to start and what is needed to get data. */
  howToStart?: React.ReactNode;
}

/**
 * Button that opens a flyout explaining a module, with a link to its
 * documentation under the title. The body always renders, in this order: the
 * overview, the terms, the extra sections, the indices and how to start.
 */
export const AboutFlyoutButton = ({
  title,
  testSubj,
  docsPath,
  overview,
  terms,
  extraSections,
  indices,
  howToStart,
}: AboutFlyoutButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = `wzAbout${testSubj}Title`;

  return (
    <>
      <EuiButtonEmpty
        iconType='iInCircle'
        onClick={() => setIsOpen(true)}
        data-test-subj={`wzAbout${testSubj}Button`}
      >
        {title}
      </EuiButtonEmpty>
      {isOpen && (
        <EuiFlyout
          onClose={() => setIsOpen(false)}
          size='m'
          ownFocus
          aria-labelledby={titleId}
          data-test-subj={`wzAbout${testSubj}Flyout`}
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='s'>
              <h2 id={titleId}>{title}</h2>
            </EuiTitle>
            <EuiSpacer size='xs' />
            <EuiText size='s'>
              <p>
                <FormattedMessage
                  id='wazuh.common.aboutFlyout.learnMore'
                  defaultMessage='Learn more in the {link}.'
                  values={{
                    link: (
                      <AboutFlyoutDocsLink path={docsPath}>
                        {i18n.translate(
                          'wazuh.common.aboutFlyout.learnMoreLink',
                          { defaultMessage: 'documentation' },
                        )}
                      </AboutFlyoutDocsLink>
                    ),
                  }}
                />
              </p>
            </EuiText>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiText size='s'>{overview}</EuiText>
            {terms?.length ? (
              <AboutFlyoutSection
                title={i18n.translate('wazuh.common.aboutFlyout.termsTitle', {
                  defaultMessage: 'Terms',
                })}
              >
                <AboutFlyoutTerms terms={terms} />
              </AboutFlyoutSection>
            ) : null}
            {extraSections?.map(({ title: sectionTitle, content }) => (
              <AboutFlyoutSection key={sectionTitle} title={sectionTitle}>
                {content}
              </AboutFlyoutSection>
            ))}
            {indices?.length ? (
              <AboutFlyoutSection
                title={i18n.translate('wazuh.common.aboutFlyout.indicesTitle', {
                  defaultMessage: 'Indices',
                })}
              >
                <AboutFlyoutIndices testSubj={testSubj} indices={indices} />
              </AboutFlyoutSection>
            ) : null}
            {howToStart ? (
              <AboutFlyoutSection
                title={i18n.translate(
                  'wazuh.common.aboutFlyout.howToStartTitle',
                  { defaultMessage: 'How to start' },
                )}
              >
                <EuiText size='s'>{howToStart}</EuiText>
              </AboutFlyoutSection>
            ) : null}
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};
