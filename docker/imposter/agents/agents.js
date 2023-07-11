var agentId = context.request.queryParams.agents_list;

console.log(agentId);

switch (agentId) {
  case undefined:
    respond().withStatusCode(200).withFile('agents/agents.json');
    break;
  case '001':
    respond().withStatusCode(200).withFile('agents/agent_active_groups.json');
    break;
  case '003':
  case '010':
    respond().withStatusCode(200).withFile('agents/agent_disconnected.json');
    break;
  case '004':
  case '007':
  case '008':
  case '009':
    respond().withStatusCode(200).withFile('agents/agent_never_connected.json');
    break;
  case '005':
    respond().withStatusCode(200).withFile('agents/agent_macos.json');
    break;
  case '006':
    respond().withStatusCode(200).withFile('agents/agent_pending.json');
    break;
  default:
    respond().withStatusCode(200).withFile('agents/agent.json');
    break;
}
