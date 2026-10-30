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
  EuiAccordion,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCode,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiHorizontalRule,
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
  /** Extra collapsible sections rendered after the terms. */
  extraSections?: AboutFlyoutSectionDefinition[];
  /** Index patterns that the module reads and the tab that reads each one. */
  indices?: AboutFlyoutIndex[];
  /** Where to start and what is needed to get data. */
  howToStart?: React.ReactNode;
}

/**
 * Button that opens a flyout explaining a module, with a link to its
 * documentation under the title. The body renders, in this order: the overview,
 * how to start, links to the sections and the collapsible sections (terms,
 * extra sections and indices). The first section starts open.
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
  const sections = [
    ...(terms?.length
      ? [
          {
            key: 'terms',
            title: i18n.translate('wazuh.common.aboutFlyout.termsTitle', {
              defaultMessage: 'Terms',
            }),
            content: <AboutFlyoutTerms terms={terms} />,
          },
        ]
      : []),
    ...(extraSections ?? []).map(({ title: sectionTitle, content }, index) => ({
      key: `extra-${index}`,
      title: sectionTitle,
      content,
    })),
    ...(indices?.length
      ? [
          {
            key: 'indices',
            title: i18n.translate('wazuh.common.aboutFlyout.indicesTitle', {
              defaultMessage: 'Indices',
            }),
            content: (
              <AboutFlyoutIndices testSubj={testSubj} indices={indices} />
            ),
          },
        ]
      : []),
  ];
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    sections.length ? { [sections[0].key]: true } : {},
  );
  const getSectionId = (key: string) => `wzAbout${testSubj}Section-${key}`;
  const jumpToSection = (key: string) => {
    setOpenSections(previous => ({ ...previous, [key]: true }));
    document.getElementById(getSectionId(key))?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'start',
    });
  };

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
            <EuiText size='m'>{overview}</EuiText>
            {howToStart ? (
              <>
                <EuiSpacer size='m' />
                <EuiCallOut
                  size='m'
                  iconType='play'
                  title={i18n.translate(
                    'wazuh.common.aboutFlyout.howToStartTitle',
                    { defaultMessage: 'How to start' },
                  )}
                  data-test-subj={`wzAbout${testSubj}HowToStart`}
                >
                  <EuiText size='s'>{howToStart}</EuiText>
                </EuiCallOut>
              </>
            ) : null}
            {sections.length > 1 ? (
              <>
                <EuiSpacer size='m' />
                <EuiFlexGroup
                  gutterSize='m'
                  alignItems='center'
                  responsive={false}
                  wrap
                >
                  <EuiFlexItem grow={false}>
                    <EuiText size='s' color='subdued'>
                      {i18n.translate('wazuh.common.aboutFlyout.jumpTo', {
                        defaultMessage: 'Jump to',
                      })}
                    </EuiText>
                  </EuiFlexItem>
                  {sections.map(({ key, title: sectionTitle }) => (
                    <EuiFlexItem grow={false} key={key}>
                      <EuiLink onClick={() => jumpToSection(key)}>
                        {sectionTitle}
                      </EuiLink>
                    </EuiFlexItem>
                  ))}
                </EuiFlexGroup>
              </>
            ) : null}
            {sections.length ? <EuiSpacer size='m' /> : null}
            {sections.map(({ key, title: sectionTitle, content }) => (
              <React.Fragment key={key}>
                <EuiHorizontalRule margin='s' />
                <EuiAccordion
                  id={getSectionId(key)}
                  data-test-subj={getSectionId(key)}
                  arrowDisplay='left'
                  paddingSize='m'
                  buttonContent={
                    <EuiTitle size='xs'>
                      <h3>{sectionTitle}</h3>
                    </EuiTitle>
                  }
                  forceState={openSections[key] ? 'open' : 'closed'}
                  onToggle={isSectionOpen =>
                    setOpenSections(previous => ({
                      ...previous,
                      [key]: isSectionOpen,
                    }))
                  }
                >
                  {content}
                </EuiAccordion>
              </React.Fragment>
            ))}
            {sections.length ? <EuiHorizontalRule margin='s' /> : null}
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};
