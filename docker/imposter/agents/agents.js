var agentId = context.request.queryParams.agents_list;


switch (agentId) {
  case undefined:
    respond().withStatusCode(200).withFile('agents/agents.json');
    break;
  case '004':
    respond().withStatusCode(200).withFile('agents/agent_never_connected.json');
    break;
  default:
    respond().withStatusCode(200).withFile('agents/agent.json');
    break;
}
