var search = context.request.queryParams.search

switch (search) {
  case 'nologs':
    respond().withStatusCode(200).withFile('cluster/cluster_no_logs.json');
    break;
  case undefined:
    respond().withStatusCode(200).withFile('cluster/cluster_logs.json');
    break;
  default:
    respond().withStatusCode(200).withFile('cluster/cluster_logs.json');
    break;
}
