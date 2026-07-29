import { isIP } from 'net';
import { lookup as dnsLookup } from 'dns/promises';

/**
 * SSRF hardening for provider `baseUrl` -- defense-in-depth behind the admin-only gate
 * on the provider mutation/test routes (server/routes/settings.ts). Deliberately proportionate,
 * NOT a blanket private-IP block: this plugin is explicitly built to talk to self-hosted LLM
 * gateways (Ollama, vLLM, LiteLLM, the eval mock provider) on `localhost`/RFC1918, so those stay
 * reachable. Only three things are ever rejected:
 *
 *  1. Non-`http(s)` URL schemes (`file:`, `gopher:`, `data:`, ...) -- no legitimate provider needs
 *     them, and several can read local files or reach other local protocols the fetch layer was
 *     never meant to expose.
 *  2. The link-local / cloud-metadata range (IPv4 `169.254.0.0/16`, IPv6 `fe80::/10`), the named
 *     cloud-metadata service hostnames, plus Alibaba Cloud's `100.100.100.200` and the
 *     `192.0.0.0/24` IETF special-purpose block that contains Oracle Cloud's `192.0.0.192` -- no
 *     legitimate LLM endpoint lives in any of these, and they are exactly the high-value SSRF
 *     targets (cloud IAM credential theft).
 *  3. Any address a non-literal `baseUrl` hostname RESOLVES to, re-checked against the
 *     exact same ranges as (2) -- see `assertProviderUrlAllowed`'s doc comment below.
 *
 * Loopback (`127.0.0.1`, `::1`) and RFC1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) are
 * INTENTIONALLY left reachable -- that is the documented, accepted deployment shape (an admin
 * pointing this plugin at an internal gateway), with the admin-only gate on the provider
 * routes as the actual control for that residual trust.
 *
 * Range-checking only a hostname that is ALREADY a literal IP is not enough, which is why this
 * function is async. A public wildcard-DNS name whose A record IS the metadata address (e.g. a
 * `*.nip.io` host resolving to 169.254.169.254) reaches cloud metadata with no DNS-rebinding
 * server involved at all. So whenever the hostname is not itself a literal IP, it is resolved and
 * EVERY resolved address is re-checked with `isAddressBlocked` -- the same predicate used for a
 * literal-IP hostname, so the range logic has one implementation rather than two that could
 * drift apart.
 *
 * On a DNS resolution failure (ENOTFOUND, EAI_AGAIN, a resolver timeout, ...) this function
 * ALLOWS the URL rather than rejecting it, and lets the `fetch()` that follows fail naturally.
 * Failing closed here would make a gateway that is merely temporarily unreachable -- DNS not yet
 * propagated for a freshly-provisioned host, a container still starting, a transient resolver
 * blip -- PERMANENTLY unconfigurable from the Settings page (every future create/update/test would
 * also fail the same DNS lookup), which is a worse outcome than deferring the failure to the
 * `fetch()` call immediately after this check.
 *
 * Residual, accepted and documented: DNS rebinding (the resolved address checked here differing
 * from the address the subsequent `fetch()` actually connects to, because the name re-resolves
 * between the two calls) remains an accepted risk. This module deliberately does NOT attempt
 * connection pinning (e.g. forcing the following `fetch()`/`http.request()` onto the exact
 * address just checked via a custom `lookup` option) -- that is the only complete fix for
 * rebinding, and is deliberately not attempted here; the resolve-then-connect TOCTOU window is
 * documented here rather than silently left unaddressed.
 *
 * Call this at the point of every server-side provider fetch -- server/providers/
 * openai-compatible.ts, anthropic.ts, wazuh-brain.ts, and server/routes/settings.ts's create,
 * update, and `POST /providers/{id}/test` routes all `await` this immediately before their
 * `fetch()` (the fetch-time check in each adapter is the security-critical one: a stored provider
 * config can predate this fix even where settings.ts also validates at create/update time).
 */
export class ProviderUrlRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderUrlRejectedError';
  }
}

/** Literal hostname forms of well-known cloud-metadata services, checked as an exact (lowercased)
 * hostname match -- no DNS resolution is required to catch these (though the DNS-resolution step
 * would also catch them via their resolved address). GCP is the main offender with named hosts
 * (both the FQDN and its bare short form resolve); AWS/Azure/Alibaba/Oracle's IMDS is
 * conventionally reached by IP alone. */
const METADATA_HOSTNAMES = new Set([
  'metadata.google.internal',
  'metadata.goog',
  'metadata',
]);

/**
 * True for any IPv4 dotted-decimal address in a blocked metadata/link-local range. This is THE
 * single IPv4 range predicate, reused for: a literal-IP `baseUrl` hostname, a DNS-resolved address
 * (via DNS resolution), and an IPv4 address embedded in an IPv6 literal (via `isBlockedIPv6` below) --
 * one implementation, so all three call sites can never drift out of sync with each other.
 */
function isBlockedIPv4(address: string): boolean {
  const octets = address.split('.').map(part => Number(part));
  if (
    octets.length !== 4 ||
    octets.some(value => !Number.isInteger(value) || value < 0 || value > 255)
  ) {
    return false;
  }
  const [a, b, c, d] = octets;
  // 169.254.0.0/16 -- link-local, includes the AWS/Azure/GCP metadata address 169.254.169.254.
  if (a === 169 && b === 254) {
    return true;
  }
  // Alibaba Cloud's metadata service (fixed single address, not a documented wider range).
  if (a === 100 && b === 100 && c === 100 && d === 200) {
    return true;
  }
  // 192.0.0.0/24 -- IETF special-purpose block (RFC 6890), reserved for protocol assignments and
  // never legitimately routable to an LLM endpoint. Blocking the whole /24 rather than just
  // Oracle Cloud's 192.0.0.192 metadata address within it: it is entirely reserved space, so the
  // wider block costs nothing in false positives while covering the metadata address either way.
  if (a === 192 && b === 0 && c === 0) {
    return true;
  }
  return false;
}

/**
 * Parses a validated IPv6 literal (bracket-stripped, `net.isIP() === 6`) into its 16 raw bytes, so
 * `isBlockedIPv6` below can do a byte-level check instead of matching one regex per known textual
 * format. Handles the standard `::` zero-compression, AND a dotted-quad IPv4 tail (e.g.
 * `::ffff:169.254.169.254` or the extra-zero-group `::ffff:0:169.254.169.254` form) by parsing the
 * trailing `a.b.c.d` directly into the last 4 bytes regardless of what precedes it -- deliberately
 * format-agnostic rather than one regex per known shape, to stay robust/
 * over-inclusive here. Returns undefined for anything that doesn't parse into exactly 8 groups
 * (should not happen for an address `net.isIP()` already validated, but this stays defensive
 * rather than assuming that invariant).
 */
function parseIPv6Bytes(address: string): number[] | undefined {
  // Strip a zone id (`%eth0` etc) if present -- defensive; not expected from a URL hostname or a
  // plain `dns.lookup` result, but harmless to tolerate.
  let text = address.split('%')[0];

  let embeddedV4: number[] | undefined;
  const dotIndex = text.indexOf('.');
  if (dotIndex !== -1) {
    const groupStart = text.lastIndexOf(':', dotIndex) + 1;
    const v4Text = text.slice(groupStart);
    const octets = v4Text.split('.').map(part => Number(part));
    if (
      octets.length !== 4 ||
      octets.some(value => !Number.isInteger(value) || value < 0 || value > 255)
    ) {
      return undefined;
    }
    embeddedV4 = octets;
    // Replace the dotted quad with two placeholder zero groups so the rest of the string parses
    // as plain hex-group IPv6; the placeholder's bytes are overwritten with the real ones below
    // regardless of where they land, which is what makes this format-agnostic.
    text = `${text.slice(0, groupStart)}0:0`;
  }

  const doubleColonParts = text.split('::');
  if (doubleColonParts.length > 2) {
    return undefined;
  }

  const headGroups = doubleColonParts[0]
    ? doubleColonParts[0].split(':').filter(Boolean)
    : [];
  const tailGroups =
    doubleColonParts.length === 2 && doubleColonParts[1]
      ? doubleColonParts[1].split(':').filter(Boolean)
      : [];

  let allGroups: string[];
  if (doubleColonParts.length === 2) {
    const fillCount = 8 - headGroups.length - tailGroups.length;
    if (fillCount < 0) {
      return undefined;
    }
    allGroups = [...headGroups, ...Array(fillCount).fill('0'), ...tailGroups];
  } else {
    allGroups = headGroups;
  }
  if (allGroups.length !== 8) {
    return undefined;
  }

  const bytes: number[] = [];
  for (const group of allGroups) {
    if (!/^[0-9a-f]{1,4}$/i.test(group)) {
      return undefined;
    }
    const value = parseInt(group, 16);
    bytes.push((value >> 8) & 0xff, value & 0xff);
  }

  if (embeddedV4) {
    bytes[12] = embeddedV4[0];
    bytes[13] = embeddedV4[1];
    bytes[14] = embeddedV4[2];
    bytes[15] = embeddedV4[3];
  }

  return bytes;
}

/**
 * True for any IPv6 literal in fe80::/10 (link-local), OR one that embeds a blocked IPv4 address
 * in its last 4 bytes. The embedded-v4 check fires whenever the first 8 bytes (four
 * hextets) are all zero -- deliberately broader than enumerating the standard `::ffff:a.b.c.d`
 * mapped shape and the `::ffff:0:a.b.c.d` v4-translated shape individually (both have an
 * all-zero first 64 bits), since being conservative/over-inclusive here is explicitly acceptable:
 * no legitimate global-unicast address (2000::/3) has its first 64 bits all zero, so this cannot
 * false-positive on a real public IPv6 provider endpoint.
 */
function isBlockedIPv6(address: string): boolean {
  const bytes = parseIPv6Bytes(address);
  if (!bytes) {
    return false;
  }
  // fe80::/10: first byte 0xfe, and the top 2 bits of the second byte are '10' (0x80-0xbf).
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) {
    return true;
  }
  if (bytes.slice(0, 8).every(byte => byte === 0)) {
    const embedded = bytes.slice(12, 16).join('.');
    if (isBlockedIPv4(embedded)) {
      return true;
    }
  }
  return false;
}

/**
 * Dispatches to `isBlockedIPv4`/`isBlockedIPv6` by address family; the ONE place both a literal
 * `baseUrl` hostname and a DNS-resolved address are checked, so the two paths can never
 * apply different range logic. Returns false (not blocked) for anything that isn't a literal IP at
 * all -- callers only invoke this once they already know they have a literal address in hand.
 */
function isAddressBlocked(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    return isBlockedIPv4(address);
  }
  if (version === 6) {
    return isBlockedIPv6(address);
  }
  return false;
}

/** Strips the `[...]` brackets the WHATWG URL parser wraps around a literal IPv6 host in
 * `url.hostname` (e.g. `[fe80::1]`) -- `net.isIP()` and the checks above expect a bare address. A
 * plain (non-bracketed) hostname is returned unchanged. */
function stripIPv6Brackets(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;
}

/** A resolver function matching `dns.promises.lookup(hostname, {all: true, ...})`'s return shape:
 * injectable so tests can supply resolved addresses deterministically instead of depending
 * on real DNS/network access, without changing production callers (which all use the default). */
export type DnsResolver = (
  hostname: string,
) => Promise<Array<{ address: string; family: number }>>;

const defaultResolver: DnsResolver = hostname =>
  dnsLookup(hostname, { all: true, verbatim: true });

/**
 * Throws `ProviderUrlRejectedError` when `rawUrl` fails the policy above;
 * resolves with no value when the URL may be fetched. The thrown message states which policy rule
 * fired but never echoes internals beyond the (caller-supplied) URL itself -- safe to surface
 * directly to an admin caller (the `/test` route's `message` field) or fold into a provider
 * adapter's normal `{type:'error'}` stream event.
 *
 * `resolve` defaults to `dns.promises.lookup` and is only overridden by tests (the injectable-
 * resolver requirement) -- every production call site should call this with one argument.
 */
export async function assertProviderUrlAllowed(
  rawUrl: string,
  resolve: DnsResolver = defaultResolver,
): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ProviderUrlRejectedError(
      'Provider request rejected: the configured URL could not be parsed.',
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ProviderUrlRejectedError(
      'Provider request rejected: only http(s) URLs are allowed by policy.',
    );
  }

  const hostname = stripIPv6Brackets(parsed.hostname).toLowerCase();

  if (METADATA_HOSTNAMES.has(hostname)) {
    throw new ProviderUrlRejectedError(
      'Provider request rejected: this host is a blocked cloud-metadata endpoint.',
    );
  }

  if (isAddressBlocked(hostname)) {
    throw new ProviderUrlRejectedError(
      'Provider request rejected: this host is in the blocked link-local/metadata address range.',
    );
  }

  if (isIP(hostname) !== 0) {
    // A literal IP that passed isAddressBlocked above is fully checked already -- nothing to
    // resolve for a hostname that IS an address.
    return;
  }

  // The hostname is a domain name, not a literal IP -- resolve it and re-check every
  // returned address against the exact same predicate used above. See the module doc comment for
  // why a resolution failure allows (fails open) rather than rejecting.
  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await resolve(hostname);
  } catch {
    return;
  }

  for (const { address } of addresses) {
    if (isAddressBlocked(address)) {
      throw new ProviderUrlRejectedError(
        'Provider request rejected: this host resolves to an address in the blocked ' +
          'link-local/metadata address range.',
      );
    }
  }
}

/**
 * Fetch redirect policy every server-side provider fetch call must use: never
 * auto-follow a redirect, so a `baseUrl` that passed `assertProviderUrlAllowed` above cannot
 * 302-pivot to the metadata service (or any other blocked host) afterward. A `fetch()` call using
 * this option rejects its promise with a TypeError when the response is a redirect, which every
 * adapter's existing connection-error handling (`describeConnectionError` in ./types) already
 * treats as a normal, user-safe "could not reach the provider endpoint" failure -- no
 * adapter-specific redirect handling needed beyond passing this option through. A single shared
 * constant (rather than each of the three adapters repeating the string literal) so they can never
 * drift from each other on this setting.
 */
export const PROVIDER_FETCH_REDIRECT_POLICY = 'error' as const;
