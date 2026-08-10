interface PendingAgent {
  id: string;
  /** Version reported by GET /agents at the moment the upgrade was triggered. */
  version: string;
  trackedAtMs: number;
}

type Listener = () => void;

let pendingAgents: PendingAgent[] = [];
let listeners: Listener[] = [];

const notify = (): void => {
  listeners.forEach(listener => listener());
};

export const upgradeStatusState = {
  /** Kept on this module-level singleton so it survives a component remount. */
  getPendingAgents(): PendingAgent[] {
    return pendingAgents;
  },

  hasPending(): boolean {
    return pendingAgents.length > 0;
  },

  trackUpgrade(agents: Array<{ id: string; version: string }>): void {
    if (!agents.length) {
      return;
    }
    const trackedAtMs = Date.now();
    const existingIds = new Set(pendingAgents.map(agent => agent.id));
    const newAgents = agents
      .filter(agent => !existingIds.has(agent.id))
      .map(agent => ({ ...agent, trackedAtMs }));
    if (!newAgents.length) {
      return;
    }
    pendingAgents = [...pendingAgents, ...newAgents];
    notify();
  },

  removeAgents(agentIds: string[]): void {
    const removed = new Set(agentIds);
    const nextPendingAgents = pendingAgents.filter(
      agent => !removed.has(agent.id),
    );
    if (nextPendingAgents.length === pendingAgents.length) {
      return;
    }
    pendingAgents = nextPendingAgents;
    notify();
  },

  reset(): void {
    pendingAgents = [];
    notify();
  },

  /** Lets components react to tracking changes without waiting for the next poll tick. */
  subscribe(listener: Listener): () => void {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
};
