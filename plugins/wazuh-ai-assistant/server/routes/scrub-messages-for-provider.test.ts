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

test('F1 regression: an ordinary question is left untouched EVEN WITH A POPULATED DICTIONARY (no false-positive mangling)', () => {
  // Was near-vacuous before this fix: it ran against an EMPTY pseudonymizer, so the dictionary
  // scan was a no-op by construction and could never have caught the F1 defect (common minted
  // words corrupting ordinary prose). Populated with the exact live repro's entities -- "ubuntu"/
  // "critical" minted VAL (the escape hatch's fail-closed default for a field with no host/ip/
  // user keyword), "root" minted USER (a real "root" user is a plausible value) -- so this test
  // now actually exercises `scrubMessagesForProvider`'s `identifiersOnly: true` call and would
  // fail without it.
  const p = new Pseudonymizer();
  p.pseudonymize('ubuntu', 'VAL');
  p.pseudonymize('critical', 'VAL');
  p.pseudonymize('root', 'USER');
  p.pseudonymize('dbprod07', 'HOST'); // an unrelated real identifier, also not present in this text

  const text =
    'Can you summarize the top failing SCA checks from the last 24 hours and group them by policy?';

  const [scrubbed] = scrubMessagesForProvider([userMessage(text)], p);

  assert.equal(scrubbed.content, text);
});

test('F1 regression: the live-repro sentence is left untouched with the exact entities that corrupted it', () => {
  // Live-reproduced defect: "Which Ubuntu agents are critical? root cause please" became
  // "Which VAL_2 agents are VAL_3? USER_4 cause please" once these three words had each been
  // minted from unrelated fields earlier in the conversation.
  const p = new Pseudonymizer();
  p.pseudonymize('ubuntu', 'VAL');
  p.pseudonymize('critical', 'VAL');
  p.pseudonymize('root', 'USER');

  const text = 'Which Ubuntu agents are critical? root cause please';
  const [scrubbed] = scrubMessagesForProvider([userMessage(text)], p);

  assert.equal(scrubbed.content, text);
});

test('NF-1: a message with no matching identifiers passes through unchanged even with a populated dictionary', () => {
  // Was near-vacuous before this fix: it ran against an EMPTY pseudonymizer, making the dictionary
  // scan a no-op by construction regardless of whether the filter existed at all. Populated with
  // real minted entities that simply do not appear in this message's text, so the "no match" path
  // is genuinely exercised.
  const p = new Pseudonymizer();
  p.pseudonymize('dbprod07', 'HOST');
  p.pseudonymize('jsmith', 'USER');
  const text = 'no identifiers in this message at all';

  const [scrubbed] = scrubMessagesForProvider([userMessage(text)], p);

  assert.equal(scrubbed.content, text);
});

test('F10: a bare identifier typed on turn N is masked when that SAME turn is re-sent on turn N+1', () => {
  // Bounds the NF-1 residual precisely: a client re-sends the FULL message history on every turn
  // (chat-page.tsx keeps `messages` across turns within one mounted session), so a user message
  // that minted a pseudonym via `scrubMessagesForProvider` on turn N must come back masked again
  // when that same message object is re-scrubbed as part of turn N+1's longer history -- the
  // pseudonymizer instance is shared/reused across the whole session's turns (server/routes/
  // chat.ts constructs one per request, seeded from the client-held map each time), so anything
  // minted on turn N is already in the dictionary by turn N+1.
  const p = new Pseudonymizer();

  // Turn N: the user types a bare hostname for the first time; nothing has minted it yet, so it
  // is caught by the FQDN/IP shape scan only if it has that shape -- here it does not, so it is
  // the escape-hatch/tool-value path (simulated directly via pseudonymize) that mints it, exactly
  // as get_agents/name would for the corresponding tool-call result earlier in the same turn.
  const pseudonym = p.pseudonymize('dbprod07', 'HOST');
  const turnNMessage = userMessage('can you check on dbprod07 for me?');
  const [scrubbedTurnN] = scrubMessagesForProvider([turnNMessage], p);
  assert.equal(scrubbedTurnN.content, `can you check on ${pseudonym} for me?`);

  // Turn N+1: the SAME turn-N message object is re-sent (unscrubbed -- chat.ts always re-scrubs
  // the raw accumulated history, never persists the scrubbed copy) as part of a longer history,
  // alongside a new turn-N+1 message. Both must come back masked using the SAME pseudonymizer
  // instance (the dictionary now already knows "dbprod07").
  const turnNPlus1Message = userMessage('is it still noisy on dbprod07?');
  const [reScrubbedTurnN, scrubbedTurnNPlus1] = scrubMessagesForProvider(
    [turnNMessage, turnNPlus1Message],
    p,
  );

  assert.equal(reScrubbedTurnN.content, `can you check on ${pseudonym} for me?`);
  assert.doesNotMatch(reScrubbedTurnN.content, /dbprod07/i);
  assert.equal(scrubbedTurnNPlus1.content, `is it still noisy on ${pseudonym}?`);
  assert.doesNotMatch(scrubbedTurnNPlus1.content, /dbprod07/i);
});

test('NF-1: the system message is never scrubbed (unchanged behavior)', () => {
  const p = new Pseudonymizer();
  p.pseudonymize('dbprod07', 'HOST');
  const system: ChatMessage = { role: 'system', content: 'talk about dbprod07' };

  const [scrubbed] = scrubMessagesForProvider([system], p);

  assert.equal(scrubbed.content, 'talk about dbprod07');
});
