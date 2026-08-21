import assert from 'node:assert/strict';
import { scrubMessagesForProvider } from './chat';
import { Pseudonymizer } from '../tools/privacy';
import { ChatMessage } from '../../common/types';

/**
 * NF-1 (live-proven pentest finding, AI/qa/pentest-v34-validate/20260821-104441-326864.md): with
 * privacy mode ON, a BARE hostname (`dbprod07`, no dotted suffix) or a username (`jsmith`) typed
 * by the user reached the provider completely unmasked -- `scrubMessagesForProvider`'s `user`
 * branch only ever ran `prescanAndMint` (IPv4/IPv6/dotted-FQDN shape scan only) before
 * `applyToText`. Fixed by additionally running `scrubKnownEntities` (the same known-entity
 * dictionary scan `scrubFieldValue`'s `allow-scan` branch already uses) over the pre-scanned user
 * text, so an identifier ALREADY MINTED elsewhere this conversation (any kind, any casing) is
 * caught when the user retypes it bare. See scrubMessagesForProvider's own doc comment for the
 * full rationale and the residual this does NOT close (a bare identifier the user types that has
 * never been minted anywhere in the conversation before -- documented, not silently accepted).
 *
 * NOTE (running outside the OSD tree): imports `./chat`, which imports `@osd/config-schema` --
 * unresolvable outside the full wazuh-dashboard checkout this repo is normally built against. Same
 * colocated-unit-test convention as every other chat-*.test.ts/routes/*.test.ts file in this
 * directory; CI runs it under the platform runner.
 */

function userMessage(content: string): ChatMessage {
  return { role: 'user', content };
}

test('NF-1: a previously-minted bare hostname is masked when the user retypes it verbatim', () => {
  const p = new Pseudonymizer();
  // Simulate an earlier turn/tool result having already minted "dbprod07" as a HOST pseudonym --
  // e.g. via scrubFieldValue's anonymize branch on wazuh.agent.name.
  const pseudonym = p.pseudonymize('dbprod07', 'HOST');

  const [scrubbed] = scrubMessagesForProvider(
    [userMessage('can you check on dbprod07 for me?')],
    p,
  );

  assert.equal(
    scrubbed.content,
    `can you check on ${pseudonym} for me?`,
  );
  assert.doesNotMatch(scrubbed.content, /dbprod07/i);
});

test('NF-1: a previously-minted bare identifier retyped in a DIFFERENT CASING is still masked', () => {
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('DBPROD07', 'HOST');

  const [scrubbed] = scrubMessagesForProvider(
    [userMessage('is dbprod07 still noisy')],
    p,
  );

  assert.equal(scrubbed.content, `is ${pseudonym} still noisy`);
  assert.doesNotMatch(scrubbed.content, /dbprod07/i);
});

test('NF-1: a previously-minted username retyped bare is masked', () => {
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('jsmith', 'USER');

  const [scrubbed] = scrubMessagesForProvider(
    [userMessage('what did jsmith do yesterday')],
    p,
  );

  assert.equal(scrubbed.content, `what did ${pseudonym} do yesterday`);
});

test('NF-1 documented residual: a bare identifier NEVER minted anywhere in the conversation is left unmasked', () => {
  // This is the exact pentest transcript's remaining gap: nothing in this conversation has ever
  // minted "dbprod07" or "jsmith" (no prior tool digest, no prior user message), so neither the
  // shape scan (no dotted/IP shape) nor the known-entity dictionary scan (nothing to match) can
  // single them out -- documented in scrubMessagesForProvider's doc comment as the accepted
  // residual, not silently swallowed.
  const p = new Pseudonymizer();

  const [scrubbed] = scrubMessagesForProvider(
    [
      userMessage(
        'hostname dbprod07 ; user jsmith -- have either of these shown up before?',
      ),
    ],
    p,
  );

  assert.match(scrubbed.content, /dbprod07/);
  assert.match(scrubbed.content, /jsmith/);
});

test('NF-1 regression: an IP address is still minted and masked', () => {
  const p = new Pseudonymizer();

  const [scrubbed] = scrubMessagesForProvider(
    [userMessage('why does 10.20.30.44 keep alerting')],
    p,
  );

  assert.match(scrubbed.content, /IP_\d+/);
  assert.doesNotMatch(scrubbed.content, /10\.20\.30\.44/);
});

test('NF-1 regression: a dotted FQDN is still minted and masked', () => {
  const p = new Pseudonymizer();

  const [scrubbed] = scrubMessagesForProvider(
    [userMessage('ping dbprod07.corp.example.com please')],
    p,
  );

  assert.match(scrubbed.content, /HOST_\d+/);
  assert.doesNotMatch(scrubbed.content, /dbprod07\.corp\.example\.com/);
});

test('NF-1 regression: an ordinary question with no identifiers is left untouched (no false-positive mangling)', () => {
  const p = new Pseudonymizer();
  const text =
    'Can you summarize the top failing SCA checks from the last 24 hours and group them by policy?';

  const [scrubbed] = scrubMessagesForProvider([userMessage(text)], p);

  assert.equal(scrubbed.content, text);
});

test('NF-1: privacy-off path is unaffected (scrubMessagesForProvider is simply never called)', () => {
  // scrubMessagesForProvider is only ever invoked from chat.ts when `privacyCtx` is set, i.e.
  // privacy mode resolved ON for this turn (see resolvePrivacyEnabled/orchestrate call sites) --
  // there is no separate "privacy off" branch inside this function to regress. This test pins that
  // a message untouched by any mint/known-entity match (privacy mode's own no-op case) still comes
  // back byte-for-byte identical, which is the same observable behavior "privacy off" has today.
  const p = new Pseudonymizer();
  const text = 'no identifiers in this message at all';

  const [scrubbed] = scrubMessagesForProvider([userMessage(text)], p);

  assert.equal(scrubbed.content, text);
});

test('NF-1: the system message is never scrubbed (unchanged behavior)', () => {
  const p = new Pseudonymizer();
  p.pseudonymize('dbprod07', 'HOST');
  const system: ChatMessage = { role: 'system', content: 'talk about dbprod07' };

  const [scrubbed] = scrubMessagesForProvider([system], p);

  assert.equal(scrubbed.content, 'talk about dbprod07');
});
