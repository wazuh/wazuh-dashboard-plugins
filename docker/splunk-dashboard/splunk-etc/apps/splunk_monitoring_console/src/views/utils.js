/**
 * Created by cykao on 7/19/16.
 */
define([
    'underscore'
], function(
    _
) {
    var ROLE_LABELS = {
        'indexer': _('Indexer').t(),
        'license_manager': _('License Manager').t(),
        'license_master': _('License Manager').t(),
        'search_head': _('Search Head').t(),
        'cluster_master': _('Cluster Manager').t(),
        'cluster_manager': _('Cluster Manager').t(),
        'deployment_server': _('Deployment Server').t(),
        'kv_store': _('KV Store').t(),
        'management_console': _('Monitoring Console').t(),
        'shc_deployer': _('SHC Deployer').t()
    };

    return {
        ROLE_LABELS: ROLE_LABELS
    };
});
