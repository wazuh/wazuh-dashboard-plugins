
var storeWazuh = stores.open('storeWazuh');
var attemptRestart = storeWazuh.load('attempt');


if(attemptRestart < 5){
    storeWazuh.save('attempt', attemptRestart + 1);
    respond()
        .withStatusCode(200)
        .withFile('cluster/cluster_sync_no_sync.json')
} else {
    storeWazuh.save('attempt', 0);
    respond()
        .withStatusCode(200)
        .withFile('cluster/cluster_sync.json')
}




