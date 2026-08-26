import { describeTurnStatus } from './turn-status';

/**
 * The point of `step` is that the reader stops seeing "Routing…" — an orchestrator word — and that
 * the label can be translated at all. Both halves are asserted here: a recognized step must NOT
 * fall back to the server's English, and an unrecognized/absent one MUST.
 */
describe('describeTurnStatus', () => {
  it('replaces the server message with a user-facing label for each known step', () => {
    expect(
      describeTurnStatus({ message: 'Routing…', step: 'understanding' }),
    ).toBe('Understanding your question…');
    expect(
      describeTurnStatus({ message: 'Writing the answer…', step: 'writing' }),
    ).toBe('Writing the answer…');
  });

  it('names the tool a querying step is running, and stays generic when none was reported', () => {
    expect(
      describeTurnStatus({
        message: 'Querying Wazuh…',
        step: 'querying',
        detail: 'get_agent_inventory',
      }),
    ).toBe('Querying get_agent_inventory…');
    // No `detail`: the label must not invent a target.
    expect(
      describeTurnStatus({ message: 'Querying Wazuh…', step: 'querying' }),
    ).toBe('Querying your data…');
  });

  it('falls back to the raw message for a producer that classifies nothing', () => {
    // server/providers/retry.ts's notices carry no `step` — they are already reader-facing
    // sentences, not phases of a turn, and must survive verbatim.
    expect(
      describeTurnStatus({
        message: 'Provider rate limit reached — retrying in 5s',
      }),
    ).toBe('Provider rate limit reached — retrying in 5s');
  });

  it('falls back to the raw message for a step this build does not recognize', () => {
    // Forward compatibility: a newer server sending an unknown step must degrade to its own
    // message rather than render an empty status line.
    expect(
      describeTurnStatus({
        message: 'Consolidating…',
        step: 'consolidating' as never,
      }),
    ).toBe('Consolidating…');
  });
});
