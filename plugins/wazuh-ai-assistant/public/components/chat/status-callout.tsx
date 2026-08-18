import React from 'react';
import { EuiButtonIcon, EuiCallOut, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface StatusCalloutProps {
  title: React.ReactNode;
  body: React.ReactNode;
  color: React.ComponentProps<typeof EuiCallOut>['color'];
  iconType: React.ComponentProps<typeof EuiCallOut>['iconType'];
  /** Extra content rendered right after the body `<p>`, inside the callout (e.g. a reload button). */
  action?: React.ReactNode;
  /**
   * Renders a close control in the callout's top-right corner. Omit it for a state the user must not
   * be able to hide — an expired session, or messages that are not being saved — where dismissing
   * would leave a real, still-current problem invisible; those call sites deliberately pass nothing.
   */
  onDismiss?: () => void;
  /** Whether an `EuiSpacer size="m"` follows the callout. Defaults to `true` — every call site in
   * chat-page.tsx wants the trailing spacer; the prop exists so a future call site can opt out. */
  spaced?: boolean;
}

/**
 * Presentational-only extraction (quality pass, port/5.0) of the 5 near-identical
 * `{cond && (<><EuiCallOut …><p>…</p>{action}</EuiCallOut><EuiSpacer size="m" /></>)}` blocks that
 * were inline in chat-page.tsx (generic error, providersError, managerAuthHint, sessionExpired,
 * mergeNotice merged/conflict). Renders byte-identical DOM to those blocks: same element nesting
 * (`EuiCallOut` > `<p>` + optional action, followed by an `EuiSpacer`), same props.
 *
 * `settings-page.tsx` has a slightly different inline callout variant — deliberately left
 * alone.
 */
export const StatusCallout: React.FC<StatusCalloutProps> = ({
  title,
  body,
  color,
  iconType,
  action,
  onDismiss,
  spaced = true,
}) => (
  <>
    <EuiCallOut
      title={title}
      color={color}
      iconType={iconType}
      className={onDismiss ? 'wzStatusCallout--dismissible' : undefined}
    >
      {/* Not `EuiCallOut`'s own `dismissible`/`onDismiss` pair: that implementation renders its close
        control only when `color !== 'warning' && color !== 'danger'` (call_out.js), so on the danger
        callout this component exists to serve the props would be accepted and silently do nothing.
        It also hardcodes `aria-label="dismissible_icon"`, an untranslated internal string. Rendering
        the control here keeps it available at every colour and gives it a real label. */}
      {onDismiss && (
        <EuiButtonIcon
          className='wzStatusCallout__dismiss'
          iconType='cross'
          color='text'
          onClick={onDismiss}
          aria-label={i18n.translate(
            'wazuhAiAssistant.chat.statusCallout.dismissButtonLabel',
            { defaultMessage: 'Dismiss this message' },
          )}
          data-test-subj='wzAiStatusCalloutDismiss'
        />
      )}
      <p>{body}</p>
      {action}
    </EuiCallOut>
    {spaced && <EuiSpacer size='m' />}
  </>
);
