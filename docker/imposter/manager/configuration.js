var path = context.request.path;
var pathConfiguration = path.split('/');
pathConfiguration.splice(0, 4);
switch (pathConfiguration[0]) {
  case 'labels':
    respond()
      .withStatusCode(200)
      .withFile('manager/configuration/agent_labels.json');

    break;
  case 'reports':
    respond()
      .withStatusCode(200)
      .withFile('manager/configuration/monitor_reports.json');

    break;
  default:
    respond()
      .withStatusCode(200)
      .withFile('manager/configuration/default.json');
    break;
}
