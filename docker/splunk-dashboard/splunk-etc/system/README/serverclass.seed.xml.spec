#   Version 9.0.3

<!--
# This configuration is used by deploymentClient to seed a Splunk installation with applications, at startup time.
# This file should be located in the workingDir folder defined by deploymentclient.conf.
#
# An interesting fact - the DS -> DC communication on the wire also uses this XML format.
-->
<?xml version="1.0"?>
<deployment name="somename">

    <!--
    # The endpoint from which all apps can be downloaded.  This value can be overridden by serviceClass or ap declarations below.
    # In addition, deploymentclient.conf can control how this property is used by deploymentClient - see deploymentclient.conf.spec.
    -->
    <endpoint>$deploymentServerUri$/services/streams/deployment?name=$serviceClassName$:$appName$</endpoint>

    <!--
    # The location on the deploymentClient where all applications will be installed. This value can be overridden by serviceClass or
    # app declarations below.
    # In addition, deploymentclient.conf can control how this property is used by deploymentClient - see deploymentclient.conf.spec.
    -->
    <repositoryLocation>$SPLUNK_HOME/etc/apps</repositoryLocation>

    <serviceClass name="serviceClassName">
        <!--
        # The order in which this service class is processed.
        -->
        <order>N</order>

        <!--
        # DeploymentClients can also override these values using serverRepositoryLocationPolicy and serverEndpointPolicy.
        -->
        <repositoryLocation>$SPLUNK_HOME/etc/myapps</repositoryLocation>
        <endpoint>splunk.com/spacecake/$serviceClassName$/$appName$.tgz</endpoint>

        <!--
        # Please See serverclass.conf.spec for how these properties are used.
        -->
        <continueMatching>true</continueMatching>
        <restartSplunkWeb>false</restartSplunkWeb>
        <restartSplunkd>false</restartSplunkd>
        <stateOnClient>enabled</stateOnClient>

        <app name="appName1">
            <!--
            # Applications can override the endpoint property.
            -->
            <endpoint>splunk.com/spacecake/$appName$</endpoint>
        </app>
        <app name="appName2"/>

    </serviceClass>
</deployment>

