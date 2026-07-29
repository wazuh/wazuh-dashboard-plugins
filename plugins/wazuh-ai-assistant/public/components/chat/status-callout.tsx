import React from 'react';
import { EuiCallOut, EuiSpacer } from '@elastic/eui';

interface StatusCalloutProps {
  title: React.ReactNode;
  body: React.ReactNode;
  color: React.ComponentProps<typeof EuiCallOut>['color'];
  iconType: React.ComponentProps<typeof EuiCallOut>['iconType'];
  /** Extra content rendered right after the body `<p>`, inside the callout (e.g. a reload button). */
  action?: React.ReactNode;
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
  spaced = true,
}) => (
  <>
    <EuiCallOut title={title} color={color} iconType={iconType}>
      <p>{body}</p>
      {action}
    </EuiCallOut>
    {spaced && <EuiSpacer size='m' />}
  </>
);
