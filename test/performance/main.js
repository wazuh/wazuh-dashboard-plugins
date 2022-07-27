const agentDashboard = require('./agent/agent-dashboard');
const securityEvent = require('./modules/security-events-module');

module.exports = async function(context, commands) {
    // Navigate to a URL, but do not measure the URL
    // await commands.navigate(SERVER_URL);
  
    try {
      await agentDashboard(context, commands);
    //   await securityEvent(context, commands);

      // Stop and collect the metrics
      return commands.measure.stop();
    } catch (e) {
      // We try/catch so we will catch if the the input fields can't be found
      // The error is automatically logged in Browsertime an rethrown here
      // We could have an alternative flow ...
      // else we can just let it cascade since it caught later on and reported in
      // the HTML
      throw e;
    }
  };
  