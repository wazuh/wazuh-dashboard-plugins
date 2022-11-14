if (context.request.queryParams.agents_list !== undefined) {
    respond()
        .withStatusCode(200)
        .withFile('agents/agent.json')
} else {
    respond()
        .withStatusCode(200)
        .withFile('agents/agents.json')
}