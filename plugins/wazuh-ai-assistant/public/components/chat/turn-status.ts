import { i18n } from '@osd/i18n';
import { TurnStatusStep } from '../../../common/types';

/**
 * Turns one `status` stream event into the line the reader actually sees.
 *
 * Why this exists at all: the server's own `status.message` is hardcoded English written for logs
 * and the eval harness ("Routing…"), and "Routing…" describes the ORCHESTRATOR's internals, not
 * anything the person waiting for an answer is doing or wondering about. Rather than translate
 * server strings (they are not translation keys, and matching on their text would break the moment
 * one is reworded), the server now classifies each status with a small closed `step` union
 * (common/types.ts's `TurnStatusStep`) and this maps that to a translated, user-facing label.
 *
 * `message` remains the fallback for every producer that emits no `step` — today
 * server/providers/retry.ts's rate-limit and invalid-tool-call notices, which are genuinely
 * one-off explanations rather than phases of a turn, and are already written for a reader. That is
 * also what keeps this forward-compatible: a future/older server that sends a step this build does
 * not know still renders its own message instead of nothing.
 */
export function describeTurnStatus(status: {
  message: string;
  step?: TurnStatusStep;
  detail?: string;
}): string {
  switch (status.step) {
    case 'understanding': {
      return i18n.translate('wazuhAiAssistant.chat.turnStatus.understanding', {
        defaultMessage: 'Understanding your question…',
      });
    }
    case 'querying': {
      // Named tool when the server said which one, generic otherwise — never an invented name.
      return status.detail
        ? i18n.translate('wazuhAiAssistant.chat.turnStatus.queryingNamed', {
            defaultMessage: 'Querying {target}…',
            values: { target: status.detail },
          })
        : i18n.translate('wazuhAiAssistant.chat.turnStatus.querying', {
            defaultMessage: 'Querying your data…',
          });
    }
    case 'writing': {
      return i18n.translate('wazuhAiAssistant.chat.turnStatus.writing', {
        defaultMessage: 'Writing the answer…',
      });
    }
    default: {
      return status.message;
    }
  }
}
