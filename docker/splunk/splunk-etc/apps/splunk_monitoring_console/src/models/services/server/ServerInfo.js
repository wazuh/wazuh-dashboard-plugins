define(
    [
        'underscore',
        'models/StaticIdSplunkDBase',
        '@splunk/swc-mc'
    ],
    function(
        _,
        SplunkDBaseModel,
        splunk_util
    ) {
        return SplunkDBaseModel.extend({
            urlRoot: 'server/info',
            initialize: function() {
                SplunkDBaseModel.prototype.initialize.apply(this, arguments);
            },
            productDef: {
                cloud: {
                    name: _('Splunk Cloud').t(),
                    logo: '&#xF002;',
                    iconName: 'cloudLogo'
                },
                enterprise: {
                    name: _('Splunk Enterprise').t(),
                    logo: '&#xF001;',
                    iconName: 'enterprise'
                },
                hunk: {
                    name: _('Hunk').t(),
                    logo: '&#xF000;',
                    iconName: 'hunk'
                },
                lite: {
                    name: _('Splunk Light').t(),
                    logo: '&#xF003;',
                    iconName: 'lite'
                },
                lite_free: {
                    name: _('Splunk Light Free').t(),
                    logo: '&#xF003;',
                    iconName: 'lite'
                },
                splunk: {
                    name: _('Splunk').t(),
                    logo: '&#xF001;',
                    iconName: 'enterprise'
                }
            },
            _getProductDef: function(key){
                var productDef = this.productDef[this.getBranding()];
                return productDef ? productDef[key] : '';
            },
    
            getAttr: function(attr){
                return this.entry.content.get(attr);
            },
            getBranding: function() {
                return (this.isLite() || !this.isCloud()) ? this.getProductType() : (this.getInstanceType() || 'cloud');
            },
            getProductName: function(){
                return this._getProductDef('name');
            },
            getProductLogo: function(){
                return this._getProductDef('logo');
            },
            getProductIconName: function(){
                return this._getProductDef('iconName');
            },
            getProductType: function(){
                return this.getAttr('product_type');
            },
            getInstanceType: function(){
                return this.getAttr('instance_type');
            },
            getServerRoles: function(){
                return this.getAttr('server_roles') || [];
            },
            isProductType: function(productName){
                return this.getProductType() === productName;
            },
            isInstanceType: function(instance){
                return this.getInstanceType() === instance;
            },
            isCloud: function() {
                return this.isInstanceType('cloud');
            },
            isEnterprise: function() {
                return this.isProductType('enterprise');
            },
            isEnterpriseCloud: function() {
                return this.isEnterprise() && this.isCloud();
            },
            isHunk: function() {
                return this.isProductType('hunk');
            },
            isLite: function() {
                return this.isLiteFree() || this.isLitePaid();
            },
            isLiteCloud: function(){
                return this.isLite() && this.isCloud();
            },
            isLiteFree: function() {
                return this.isProductType('lite_free');
            },
            isLitePaid: function() {
                return this.isProductType('lite');
            },
    
            isTrial: function(){
                return splunk_util.normalizeBoolean(this.getAttr('isTrial'));
            },
            isCloudTrial: function() {
                // TODO: Remove 'cloudtrial' condition once Rainmakr removes all instances of it.
                return this.isInstanceType('cloudtrial') || (this.isCloud() && this.isTrial());
            },
            isFreeLicense: function() {
                return splunk_util.normalizeBoolean(this.getAttr('isFree'));
            },
    
            getAddOns: function() {
                return this.getAttr('addOns');
            },
            getBuild: function() {
                return this.getAttr('build');
            },
            getLicenseGroup: function() {
                return this.getAttr('activeLicenseGroup');
            },
            getOsName: function() {
                return this.getAttr('os_name');
            },
            getServerName: function() {
                return this.getAttr('serverName');
            },
            getVersion: function() {
                return this.getAttr('version');
            },
    
            hasAttr: function(attr){
                return this.entry.content.has(attr);
            },
            hasAddOn: function(addOn) {
                var addOns = this.getAddOns();
                if (!addOns) {
                    return false;
                }
                return addOns.hasOwnProperty(addOn);
            },
            hasHadoopAddon: function() {
                return this.hasAddOn('hadoop');
            },
            hasEnterpriseLicense: function() {
                return this.getLicenseGroup() === 'Enterprise';
            },
            hasLiteLicense: function() {
                return this.getLicenseGroup() === 'Lite';
            },
            hasForwarderLicense: function() {
                return this.getLicenseGroup() === 'Forwarder';
            },
            isLicenseStatePreviouslyKeyed: function() {
                return this.getAttr('licenseState') === 'PREVIOUS_KEYED_LICENSE';
            },
            isLicenseStateExpired: function() {
                return this.getAttr('licenseState') === 'EXPIRED';
            },
            isClusterSearchHead: function() {
                return this.getServerRoles().indexOf('cluster_search_head') >= 0;
            },
            isDFSEnabled: function() {
                return !!this.getAttr('dfs_enabled');
            },
            isFederatedSearchEnabled: function() {
                return !!this.getAttr('federated_search_enabled');
            },
        },
        {
            id: 'server-info'
        });
    });
    