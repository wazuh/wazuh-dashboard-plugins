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

/** Empty state shown while no AI provider is configured: what the assistant answers, what it
 * sends to the provider, and how to add one. Shared by the chat (page and header panel) and the
 * Settings > Providers tab. */
export const NoProviderPrompt = ({
  headingLevel: Heading,
  onAddProvider,
  onOpenPrivacySettings,
  isAddProviderDisabled = false,
}: NoProviderPromptProps) => (
  <div className='wzNoProviderPrompt' data-test-subj='wzAiNoProviderPrompt'>
    <EuiEmptyPrompt
      iconType='machineLearningApp'
      title={
        <Heading>
          {i18n.translate('wazuhAiAssistant.noProvider.title', {
            defaultMessage: 'No AI provider configured',
          })}
        </Heading>
      }
      body={
        <p>
          {i18n.translate('wazuhAiAssistant.noProvider.purpose', {
            defaultMessage:
              'Ask questions about your agents, findings and vulnerabilities in plain language.',
          })}
        </p>
      }
    />
    <EuiSpacer size='m' />
    <div className='wzExampleCardsGrid'>
      {EXAMPLE_CARDS.map(card => (
        <EuiCard
          key={card.id}
          className='wzWelcomeCard'
          layout='horizontal'
          display='plain'
          hasBorder
          isDisabled
          titleSize='xs'
          icon={<EuiIcon type={card.icon} size='l' />}
          title={card.title}
          description={card.question}
        />
      ))}
    </div>
    <EuiSpacer size='m' />
    <EuiText
      size='s'
      color='subdued'
      textAlign='center'
      className='wzNoProviderPrompt__text'
    >
      <p>
        <FormattedMessage
          id='wazuhAiAssistant.noProvider.needsProvider'
          defaultMessage='The AI Assistant needs at least one connected provider (OpenAI-compatible or Anthropic) {providerHelp} before it can answer questions. Add one to get started.'
          values={{
            providerHelp: <ProviderHelp />,
          }}
        />
      </p>
      <p>
        <FormattedMessage
          id='wazuhAiAssistant.noProvider.dataSent'
          defaultMessage='Your questions, and the security data read to answer them, are sent to the provider. {privacyLink} sets what is masked or left out.'
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
    <EuiSpacer size='m' />
    <EuiButton
      color='primary'
      fill
      isDisabled={isAddProviderDisabled}
      onClick={onAddProvider}
    >
      {i18n.translate('wazuhAiAssistant.noProvider.action', {
        defaultMessage: 'Add a provider',
      })}
    </EuiButton>
  </div>
);
