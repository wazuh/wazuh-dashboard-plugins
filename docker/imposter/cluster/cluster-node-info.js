
var selectedNode = context.request.queryParams.select

switch (selectedNode) {
  case 'name':
    respond()
      .withStatusCode(200)
      .withFile('cluster/node/select-name.json');
    break;
  default:
    respond()
      .withStatusCode(200)
      .withFile('cluster/node/response-with-everything.json');
    break;
}

// Commented code is used to test the restart only
//
// var storeWazuh = stores.open('storeWazuh');
// var attemptRestart = storeWazuh.load('attempt');
// var callRestart = storeWazuh.load('callRestart');
// if (callRestart) {
//   if (attemptRestart < 10) {
//     storeWazuh.save('attempt', attemptRestart + 1);
//     respond()
//       .withStatusCode(200)
//       .withFile('cluster/cluster-node-info-no-restart.json')
//   } else {
//     storeWazuh.save('attempt', 0);
//     storeWazuh.save('callRestart', false);
//     respond()
//       .withStatusCode(200)
//       .withFile('cluster/cluster-node-info.json')
//   }
// } else {
//   respond()
//     .withStatusCode(200)
//     .withFile('cluster/cluster-node-info.json')
// }
