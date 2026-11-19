import './chat-page.scss';
import React, { useState } from 'react';
import {
  EuiButton,
  EuiButtonIcon,
  EuiCard,
  EuiEmptyPrompt,
  EuiIcon,
  EuiLink,
  EuiPopover,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EXAMPLE_CARDS } from './example-questions';

interface NoProviderPromptProps {
  /** `h1` where the prompt is the view's only heading (chat), `h2` under a page title (settings). */
  headingLevel: 'h1' | 'h2';
  onAddProvider: () => void;
  onOpenPrivacySettings: () => void;
  isAddProviderDisabled?: boolean;
  /** Example questions; off on Settings, where they read as chat content. */
  showExamples?: boolean;
}

/** Same click-to-open help as the composer's privacy ⓘ (chat-page.tsx), not a hover tooltip. */
const ProviderHelp = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <EuiPopover
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      anchorPosition='upCenter'
      panelPaddingSize='s'
      button={
        <EuiButtonIcon
          iconSize='m'
          iconType='iInCircle'
          color='text'
          display='empty'
          data-test-subj='wzAiNoProviderHelpButton'
          aria-expanded={isOpen}
          aria-label={i18n.translate(
            'wazuhAiAssistant.noProvider.providerHelpLabel',
            { defaultMessage: 'What is a provider?' },
          )}
          onClick={() => setIsOpen(current => !current)}
        />
      }
    >
      <EuiText size='xs' className='wzHelpPanel'>
        <p style={{ margin: 0 }}>
          {i18n.translate('wazuhAiAssistant.noProvider.providerHelp', {
            defaultMessage:
              'A provider is the AI service that writes the answers. OpenAI-compatible: ' +
              'any service with an OpenAI-style chat API, such as OpenAI, Gemini, ' +
              'Ollama, LM Studio or vLLM. Anthropic: Claude models through the ' +
              'Anthropic API.',
          })}
        </p>
      </EuiText>
    </EuiPopover>
  );
};

/** Empty state shown while no AI provider is configured. Order: what the assistant does, the
 * action, what a provider is, example questions (chat only), and what is sent to the provider.
 * Shared by the chat (page and header panel) and the Settings > Providers tab. */
export const NoProviderPrompt = ({
  headingLevel: Heading,
  onAddProvider,
  onOpenPrivacySettings,
  isAddProviderDisabled = false,
  showExamples = true,
}: NoProviderPromptProps) => {
  const SubHeading = Heading === 'h1' ? 'h2' : 'h3';

  return (
    <div className='wzNoProviderPrompt' data-test-subj='wzAiNoProviderPrompt'>
      <EuiEmptyPrompt
        iconType='machineLearningApp'
        title={
          <Heading>
            {i18n.translate('wazuhAiAssistant.noProvider.title', {
              defaultMessage: 'Connect an AI provider',
            })}
          </Heading>
        }
        body={
          <p>
            {i18n.translate('wazuhAiAssistant.noProvider.purpose', {
              defaultMessage:
                'Ask about your agents, findings and vulnerabilities in plain language.',
            })}
          </p>
        }
        actions={
          <EuiButton
            color='primary'
            fill
            isDisabled={isAddProviderDisabled}
            onClick={onAddProvider}
          >
            {i18n.translate('wazuhAiAssistant.noProvider.action', {
              defaultMessage: 'Add provider',
            })}
          </EuiButton>
        }
      />
      <EuiText
        size='s'
        color='subdued'
        textAlign='center'
        className='wzNoProviderPrompt__text'
      >
        <p>
          <FormattedMessage
            id='wazuhAiAssistant.noProvider.needsProvider'
            defaultMessage='The assistant uses an AI provider to write its answers: an OpenAI-compatible service or Anthropic {providerHelp}'
            values={{ providerHelp: <ProviderHelp /> }}
          />
        </p>
      </EuiText>
      {showExamples && (
        <>
          <EuiSpacer size='xl' />
          <EuiTitle size='xxxs' className='wzNoProviderPrompt__examplesHeading'>
            <SubHeading>
              {i18n.translate('wazuhAiAssistant.noProvider.examplesHeading', {
                defaultMessage: 'Examples of what you can ask',
              })}
            </SubHeading>
          </EuiTitle>
          <EuiSpacer size='s' />
          {/* Previews, not actions: no onClick, no border, so they don't read as buttons. */}
          <div className='wzExampleCardsGrid'>
            {EXAMPLE_CARDS.map(card => (
              <EuiCard
                key={card.id}
                className='wzWelcomeCard'
                layout='horizontal'
                display='plain'
                hasBorder={false}
                titleSize='xs'
                icon={<EuiIcon type={card.icon} size='l' color='subdued' />}
                title={card.title}
                description={card.question}
              />
            ))}
          </div>
        </>
      )}
      <EuiSpacer size='l' />
      <EuiText
        size='xs'
        color='subdued'
        textAlign='center'
        className='wzNoProviderPrompt__text'
      >
        <p>
          <FormattedMessage
            id='wazuhAiAssistant.noProvider.dataSent'
            defaultMessage='Your questions and the security data used to answer them are sent to the provider. Choose what is masked or left out in {privacyLink}.'
            values={{
              privacyLink: (
                <EuiLink
                  onClick={onOpenPrivacySettings}
                  data-test-subj='wzAiNoProviderPrivacyLink'
                >
                  {i18n.translate('wazuhAiAssistant.noProvider.privacyLink', {
                    defaultMessage: 'Privacy & data protection',
                  })}
                </EuiLink>
              ),
            }}
          />
        </p>
      </EuiText>
    </div>
  );
};
