export const DEV_TOOLS_INITIAL_BUFFER = `GET /agents?status=active

# Example comment

# You can use ? after the endpoint
# in order to get suggestions
# for your query params

GET /manager/info

POST /agents
${JSON.stringify({ name: 'NewAgent' }, null, 2)}

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
)};
`;
