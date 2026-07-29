import assert from 'node:assert/strict';
import {
  assertProviderUrlAllowed,
  ProviderUrlRejectedError,
  PROVIDER_FETCH_REDIRECT_POLICY,
  DnsResolver,
} from './url-guard';

// This is the proportionate SSRF hardening layer behind the admin-only gate
// on the provider mutation/test routes. The whole point of this file is that it is
// NOT a blanket private-IP block -- self-hosted LLM gateways (Ollama/vLLM/LiteLLM, the eval mock
// provider) legitimately live on localhost/RFC1918, so every "ALLOWS" test below is just as load-
// bearing as the "rejects" ones: a regression that started blocking loopback/RFC1918 would break
// the product this plugin is built for just as surely as a regression that stopped blocking the
// metadata range would reopen the SSRF.
//
// `assertProviderUrlAllowed` is async (it may
// resolve the hostname via DNS) -- every test below awaits it. A `resolve` stub that throws
// "should not be called" is passed to the pure literal-IP/scheme tests to prove they never reach
// the DNS-resolution branch at all (isIP() short-circuits it), keeping those tests independent of
// real network/DNS availability.

const neverResolve: DnsResolver = () => {
  throw new Error('resolver should not be called for a literal-IP hostname');
};

async function assertRejects(
  url: string,
  description: string,
  resolve: DnsResolver = neverResolve,
): Promise<void> {
  await assert.rejects(
    () => assertProviderUrlAllowed(url, resolve),
    (error: unknown) => error instanceof ProviderUrlRejectedError,
    `expected ${description} (${url}) to be rejected`,
  );
}

async function assertAllows(
  url: string,
  description: string,
  resolve: DnsResolver = neverResolve,
): Promise<void> {
  await assert.doesNotReject(
    () => assertProviderUrlAllowed(url, resolve),
    `expected ${description} (${url}) to be allowed`,
  );
}

// --- non-http(s) schemes ----------------------------------------------------------------------

test('assertProviderUrlAllowed: rejects file: scheme', async () => {
  await assertRejects('file:///etc/passwd', 'a file: URL');
});

test('assertProviderUrlAllowed: rejects gopher: scheme', async () => {
  await assertRejects('gopher://127.0.0.1:70/_x', 'a gopher: URL');
});

test('assertProviderUrlAllowed: rejects data: scheme', async () => {
  await assertRejects('data:text/plain;base64,aGVsbG8=', 'a data: URL');
});

test('assertProviderUrlAllowed: rejects an unparseable URL instead of throwing an uncaught TypeError', async () => {
  await assertRejects('not a url at all', 'garbage input');
});

// --- link-local / cloud-metadata range (literal IP hostnames -- no DNS resolution involved) ----

test('assertProviderUrlAllowed: rejects the AWS/Azure/GCP metadata IP 169.254.169.254', async () => {
  await assertRejects(
    'http://169.254.169.254/latest/meta-data/',
    'the metadata IP',
  );
});

test('assertProviderUrlAllowed: rejects the wider 169.254.0.0/16 range, not just the single metadata IP', async () => {
  await assertRejects(
    'http://169.254.1.1/',
    'a link-local IP outside the single metadata address',
  );
});

test('assertProviderUrlAllowed: rejects an IPv6 fe80::/10 link-local literal', async () => {
  await assertRejects('http://[fe80::1]/', 'an IPv6 link-local address');
});

test('assertProviderUrlAllowed: rejects the fe80::/10 upper boundary (febf::)', async () => {
  await assertRejects('http://[febf::1]/', 'the top of the fe80::/10 range');
});

test('assertProviderUrlAllowed: allows fec0:: (just past fe80::/10) -- confirms the range is bounded, not a loose prefix match', async () => {
  await assertAllows('http://[fec0::1]/', 'an address just outside fe80::/10');
});

test('assertProviderUrlAllowed: rejects the literal GCP metadata hostname', async () => {
  await assertRejects(
    'http://metadata.google.internal/computeMetadata/v1/',
    'the GCP metadata hostname',
  );
});

test('assertProviderUrlAllowed: rejects an IPv4-mapped IPv6 literal that embeds the metadata IP', async () => {
  await assertRejects(
    'http://[::ffff:169.254.169.254]/',
    'an IPv4-mapped IPv6 metadata address',
  );
});

test('assertProviderUrlAllowed: hostname matching is case-insensitive', async () => {
  await assertRejects(
    'http://METADATA.GOOGLE.INTERNAL/',
    'an uppercased metadata hostname',
  );
});

// --- additional metadata IPs + robust byte-level IPv6 embedding -------------------------

test('assertProviderUrlAllowed: rejects the Alibaba Cloud metadata IP 100.100.100.200', async () => {
  await assertRejects(
    'http://100.100.100.200/latest/meta-data/',
    'the Alibaba Cloud metadata IP',
  );
});

test('assertProviderUrlAllowed: rejects the Oracle Cloud metadata IP 192.0.0.192', async () => {
  await assertRejects(
    'http://192.0.0.192/opc/v2/instance/',
    'the Oracle Cloud metadata IP',
  );
});

test('assertProviderUrlAllowed: rejects the wider 192.0.0.0/24 IETF special-purpose block, not just 192.0.0.192', async () => {
  await assertRejects('http://192.0.0.1/', 'another address in 192.0.0.0/24');
});

test('assertProviderUrlAllowed: allows an address just outside 192.0.0.0/24', async () => {
  await assertAllows('http://192.0.1.1/', 'an address outside the blocked /24');
});

test('assertProviderUrlAllowed: rejects the non-canonical ::ffff:0:169.254.169.254 mapped-IPv6 form (extra zero group the old regex-per-format check missed)', async () => {
  await assertRejects(
    'http://[::ffff:0:169.254.169.254]/',
    'the v4-translated-style mapped IPv6 metadata address',
  );
});

test('assertProviderUrlAllowed: still allows fec0::1 with the new byte-level IPv6 check (regression guard)', async () => {
  await assertAllows('http://[fec0::1]/', 'fec0::1 under the byte-level check');
});

test('assertProviderUrlAllowed: still allows ::1 with the new byte-level IPv6 check (regression guard)', async () => {
  await assertAllows('http://[::1]/', '::1 under the byte-level check');
});

// --- explicitly allowed hosts (deliberately NOT a blanket private-IP block) -------------------

test('assertProviderUrlAllowed: allows localhost (self-hosted gateway, e.g. Ollama) -- resolves via /etc/hosts, no network needed', async () => {
  await assert.doesNotReject(() =>
    assertProviderUrlAllowed('http://localhost:11434/api/chat'),
  );
});

test('assertProviderUrlAllowed: allows loopback 127.0.0.1 (the eval mock provider)', async () => {
  await assertAllows('http://127.0.0.1:9877/', 'the loopback mock provider');
});

test('assertProviderUrlAllowed: allows loopback IPv6 ::1', async () => {
  await assertAllows('http://[::1]:8080/', 'IPv6 loopback');
});

test('assertProviderUrlAllowed: allows RFC1918 10.x (self-hosted gateway on an internal network)', async () => {
  await assertAllows('http://10.0.5.20:8080/v1', 'an RFC1918 10.x host');
});

test('assertProviderUrlAllowed: allows RFC1918 192.168.x (self-hosted gateway on a home/office LAN)', async () => {
  await assertAllows('http://192.168.1.50:11434/', 'an RFC1918 192.168.x host');
});

test('assertProviderUrlAllowed: allows RFC1918 172.16-31.x', async () => {
  await assertAllows('http://172.16.0.5/', 'an RFC1918 172.16.x host');
  await assertAllows(
    'http://172.31.255.255/',
    'the top of the RFC1918 172.16.0.0/12 range',
  );
});

// --- DNS-resolved-address rejection (a domain name must not skip the range checks) ------------

test('assertProviderUrlAllowed rejects a domain name that resolves to the metadata IP -- this is the exact gap a public wildcard-DNS name (e.g. *.nip.io) exploited', async () => {
  await assertRejects(
    'http://gateway.example.test/',
    'a domain resolving to 169.254.169.254',
    () => Promise.resolve([{ address: '169.254.169.254', family: 4 }]),
  );
});

test('assertProviderUrlAllowed rejects a domain name that resolves to a link-local IPv6 address', async () => {
  await assertRejects(
    'http://gateway.example.test/',
    'a domain resolving to fe80::1',
    () => Promise.resolve([{ address: 'fe80::1', family: 6 }]),
  );
});

test('assertProviderUrlAllowed allows a domain name that resolves to an ordinary public address', async () => {
  await assertAllows(
    'http://gateway.example.test/',
    'a domain resolving to a public IP',
    () => Promise.resolve([{ address: '203.0.113.10', family: 4 }]),
  );
});

test('assertProviderUrlAllowed checks every resolved address, not just the first', async () => {
  await assertRejects(
    'http://gateway.example.test/',
    'a domain with a benign first address and a blocked second address',
    () =>
      Promise.resolve([
        { address: '203.0.113.10', family: 4 },
        { address: '169.254.169.254', family: 4 },
      ]),
  );
});

test('assertProviderUrlAllowed allows (fails open) when DNS resolution fails -- a temporarily unreachable/not-yet-provisioned gateway must stay configurable', async () => {
  await assertAllows(
    'http://not-yet-provisioned.example.test/',
    'a domain whose DNS lookup fails',
    () => {
      const error = new Error(
        'getaddrinfo ENOTFOUND not-yet-provisioned.example.test',
      );
      (error as NodeJS.ErrnoException).code = 'ENOTFOUND';
      throw error;
    },
  );
});

test('a literal-IP hostname never invokes the resolver at all (isIP() short-circuits before any DNS call)', async () => {
  let called = false;
  await assertProviderUrlAllowed('http://127.0.0.1/', () => {
    called = true;
    return Promise.resolve([]);
  });
  assert.equal(
    called,
    false,
    'resolver must not be called for a literal IP hostname',
  );
});

// --- shared fetch options constant --------------------------------------------------------------

test('PROVIDER_FETCH_REDIRECT_POLICY: pins redirect to "error" so adapters cannot silently drift', () => {
  assert.equal(PROVIDER_FETCH_REDIRECT_POLICY, 'error');
});
