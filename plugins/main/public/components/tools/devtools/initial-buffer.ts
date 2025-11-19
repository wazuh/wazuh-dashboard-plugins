export const DEV_TOOLS_INITIAL_BUFFER = `# API Console
#
# This console allows you to interact with the server API directly
#
# TIP: You can use \`?\` after the endpoint to get suggestions for your query params
#
# Examples:

# List agents: Return information about all available agents or a list of them
GET /agents?status=active

# Get information: Return basic information such as version, compilation date, installation path
GET /manager/info

# Add agent: Add a new agent
POST /agents
${JSON.stringify({ name: 'NewAgent' }, null, 2)}
`;
