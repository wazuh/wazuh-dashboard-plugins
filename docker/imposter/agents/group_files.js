var raw_param = context.request.queryParams;

switch (raw_param.raw) {
  case 'true':
    respond().withStatusCode(200).withFile('agents/group_files_raw.xml');
    break;
  default:
    respond().withStatusCode(200).withFile('agents/group_files_default.json');
    break;
}
