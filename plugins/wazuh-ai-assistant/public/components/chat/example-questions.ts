import { i18n } from '@osd/i18n';

/**
 * Welcome-state example questions, now rendered as EuiCards (not plain badge chips) so the empty
 * state reads as a real product surface: one short title + icon per card, the full question as
 * the card description. Clicking a card only fills the input (existing `setInputText` behavior),
 * it does not auto-send, matching how the previous badge chips behaved. The no-provider prompt
 * shows the same cards disabled.
 */
export const EXAMPLE_CARDS = [
  {
    id: 'criticalAlerts',
    icon: 'alert',
    title: i18n.translate(
      'wazuhAiAssistant.chat.example.criticalAlerts.title',
      {
        defaultMessage: 'Critical findings',
      },
    ),
    // Deliberately the shortest of the three questions rather than the longest: rendered as a card
    // description in a 3-up grid, a longer phrasing like "Show me the critical findings of the
    // last 24 hours" would wrap to two lines while its two neighbours took one, so the row's cards
    // would have visibly different amounts of empty space in them.
    question: i18n.translate('wazuhAiAssistant.chat.example.criticalAlerts', {
      defaultMessage: 'Critical findings in the last 24 hours',
    }),
  },
  {
    id: 'disconnectedAgents',
    icon: 'user',
    title: i18n.translate(
      'wazuhAiAssistant.chat.example.disconnectedAgents.title',
      {
        defaultMessage: 'Disconnected agents',
      },
    ),
    question: i18n.translate(
      'wazuhAiAssistant.chat.example.disconnectedAgents',
      {
        defaultMessage: 'Which agents are disconnected?',
      },
    ),
  },
  {
    id: 'bruteForce',
    icon: 'lock',
    title: i18n.translate('wazuhAiAssistant.chat.example.bruteForce.title', {
      defaultMessage: 'Brute force attempts',
    }),
    question: i18n.translate('wazuhAiAssistant.chat.example.bruteForce', {
      defaultMessage: 'Any brute force attempts today?',
    }),
  },
];
