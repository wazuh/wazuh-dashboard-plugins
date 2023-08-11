var path = context.request.path;
var pathConfiguration = path.split('/');
pathConfiguration.splice(0, 5);
console.log(pathConfiguration);
switch (pathConfiguration[0]) {
  case 'labels':
    respond()
      .withStatusCode(200)
      .withFile('agents/configuration/agent_labels.json');

    break;
  default:
    respond().withStatusCode(200).withFile('agents/configuration/default.json');
    break;
}
