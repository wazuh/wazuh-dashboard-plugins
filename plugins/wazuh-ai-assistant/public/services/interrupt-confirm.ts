import { i18n } from '@osd/i18n';
import { OverlayStart } from '../../../../src/core/public';

/**
 * The one confirmation shown before anything interrupts an answer still being generated, shared by
 * the two places that can cause it:
 *
 *  - Leaving the app entirely (another dashboard app, a reload, closing the tab), which the platform
 *    owns: `AppMountParameters.onAppLeave` in `public/application.tsx`. OSD renders that one itself
 *    through `overlays.openConfirm`, and the handler API only carries `text`/`title` — there is no
 *    way to pass button labels or a color through it.
 *  - Opening another conversation or starting a new one, which this plugin owns.
 *
 * The second used to be a locally rendered `EuiConfirmModal`, which meant two dialogs for one
 * decision, with different wording and a different button color — the platform's default is
 * `primary`, and a plugin-side modal has no way to make the platform's match it. Routing both
 * through `overlays.openConfirm` with the SAME copy and no styling overrides makes them literally
 * the same dialog, so they cannot drift.
 */
export function interruptConfirmationTitle(): string {
  return i18n.translate('wazuhAiAssistant.chat.interruptConfirm.title', {
    defaultMessage: 'A response is still generating',
  });
}

export function interruptConfirmationText(): string {
  return i18n.translate('wazuhAiAssistant.chat.interruptConfirm.body', {
    defaultMessage:
      'Stopping it keeps what has arrived so far, saved with this conversation, and you can retry the question from there.',
  });
}

/**
 * Asks the user whether to go ahead with something that would stop the answer in progress. Resolves
 * `true` only if they confirm.
 *
 * Deliberately no `buttonColor`/label overrides: the platform's own app-leave confirmation passes
 * none either, and matching it is the whole point.
 */
export function confirmInterruption(overlays: OverlayStart): Promise<boolean> {
  return overlays.openConfirm(interruptConfirmationText(), {
    title: interruptConfirmationTitle(),
    'data-test-subj': 'wzAiAssistantInterruptConfirm',
  });
}
