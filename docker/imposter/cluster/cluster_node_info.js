
var storeWazuh = stores.open('storeWazuh');
var attemptRestart = storeWazuh.load('attempt');


if(attemptRestart < 10){
    storeWazuh.save('attempt', attemptRestart + 1);
    respond()
        .withStatusCode(200)
        .withFile('cluster/cluster_node_info_no_restart.json')
} else {
    storeWazuh.save('attempt', 0);
    respond()
        .withStatusCode(200)
        .withFile('cluster/cluster_node_info.json')
}




