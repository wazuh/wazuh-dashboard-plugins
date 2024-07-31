var agentId = context.request.queryParams.agents_list;

var queryParamsQ = context.request.queryParams.q;
var queryAgentIdExist =
  queryParamsQ !== undefined && queryParamsQ !== 'id!=000';
if (queryAgentIdExist) {
  agentIdarray = queryParamsQ.split('=');
  agentId = agentIdarray[1];
}

switch (agentId) {
  case undefined:
    respond().withStatusCode(200).withFile('agents/agent/agents.json');
    break;
  case '000':
    respond().withStatusCode(200).withFile('agents/agent/agent-manager.json');
    break;
  case '001':
    respond()
      .withStatusCode(200)
      .withFile('agents/agent/agent-active-groups.json');
    break;
  case '002':
    respond().withStatusCode(200).withFile('agents/agent/agent.json');
    break;
  case '003':
    respond().withStatusCode(200).withFile('agents/agent/agent-windows.json');
    break;
  case '004':
    respond().withStatusCode(200).withFile('agents/agent/agent-macos.json');
    break;
  case '005':
    respond().withStatusCode(200).withFile('agents/agent/agent-pending.json');
    break;
  case '006':
  case '007':
  case '008':
    respond()
      .withStatusCode(200)
      .withFile('agents/agent/agent-never-connected.json');
    break;
  case '009':
  case '010':
    respond()
      .withStatusCode(200)
      .withFile('agents/agent/agent-disconnected.json');
    break;
  default:
    respond().withStatusCode(200).withFile('agents/agent/agent.json');
    break;
}
