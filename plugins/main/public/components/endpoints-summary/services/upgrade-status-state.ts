interface PendingAgent {
  id: string;
  /** Version reported by GET /agents at the moment the upgrade was triggered. */
  version: string;
  trackedAtMs: number;
}

let pendingAgents: PendingAgent[] = [];

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
    pendingAgents = [...pendingAgents, ...newAgents];
  },

  removeAgents(agentIds: string[]): void {
    const removed = new Set(agentIds);
    pendingAgents = pendingAgents.filter(agent => !removed.has(agent.id));
  },

  reset(): void {
    pendingAgents = [];
  },
};
