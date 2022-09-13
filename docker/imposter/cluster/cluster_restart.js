if (context.request.queryParams.nodes_list !== undefined) {
    respond()
        .withStatusCode(200)
        .withFile('cluster/cluster_restart_node.json')
} else {
    respond()
        .withStatusCode(200)
        .withFile('cluster/cluster_restart.json')
}