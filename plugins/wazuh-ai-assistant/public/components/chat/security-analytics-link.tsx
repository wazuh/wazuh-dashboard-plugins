import React from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { CoreStart } from '../../../../../src/core/public';
import { TableSpec } from '../../../common/types';

export type ResolveSecurityAnalyticsUrl = (
  spec: TableSpec,
) => { label: string; url: string } | null;

/**
 * Builds the `resolveSecurityAnalyticsUrl` callback threaded down through MessageList/
 * MessageBubble/ResultTable to every SecurityAnalyticsLink instance -- created once in
 * chat-page.tsx (with `core` in closure), mirroring discover-link.tsx's `createDiscoverUrlResolver`.
 * Unlike Discover, the URL is already fully built server-side (`TableSpec.securityAnalyticsLink`,
 * see its doc comment in common/types.ts) -- no saved-object lookup is needed, so this is a plain
 * synchronous function rather than a Promise-returning one.
 */
export function createSecurityAnalyticsUrlResolver(
  core: CoreStart,
): ResolveSecurityAnalyticsUrl {
  return (spec: TableSpec) => {
    if (!spec.securityAnalyticsLink) {
      return null;
    }
    return {
      label: spec.securityAnalyticsLink.label,
      url: core.http.basePath.prepend(spec.securityAnalyticsLink.url),
    };
  };
}

interface SecurityAnalyticsLinkProps {
  spec: TableSpec;
  resolveSecurityAnalyticsUrl: ResolveSecurityAnalyticsUrl;
}

/**
 * Small "Open in Security Analytics" action rendered next to a result table (result-table.tsx's
 * accordion `extraAction`) when its spec carries `securityAnalyticsLink` -- the wazuh-threatintel-*
 * tools' equivalent of discover-link.tsx's DiscoverLink, for content that has no OSD index-pattern
 * and so never resolves a Discover link. Renders nothing if the spec carries no such link.
 */
export const SecurityAnalyticsLink: React.FC<SecurityAnalyticsLinkProps> = ({
  spec,
  resolveSecurityAnalyticsUrl,
}) => {
  const resolved = resolveSecurityAnalyticsUrl(spec);
  if (!resolved) {
    return null;
  }

  return (
    <EuiButtonEmpty
      size='xs'
      iconType='popout'
      href={resolved.url}
      target='_blank'
      rel='noopener noreferrer'
    >
      {resolved.label}
    </EuiButtonEmpty>
  );
};
