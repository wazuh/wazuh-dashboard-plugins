import { webDocumentationLink } from '../../../../common/services/web_documentation';

export const DEV_TOOLS_INITIAL_BUFFER = `# Wazuh API Console
#
# This console allows you to interact with the Wazuh API directly
#
# API Reference: ${webDocumentationLink('user-manual/api/reference.html')}
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

# Run logtest: Run logtest tool to check if a specified log raises any alert among other information
PUT /logtest
${JSON.stringify(
  {
    log_format: 'syslog',
    location: 'logtest',
    event:
      'Jul 06 22:00:22 linux-agent sshd[29205]: Invalid user blimey from 1.3.1.3 port 48928',
  },
  null,
  2,
)}
`;
