#!/bin/bash

# NOTE: This script is called by mod inputs framework for the journald
# modular input scheme.  It will simply use it to bootstrap the actual
# journald binary, splunkd

function do_scheme
{
    echo "<scheme>"
    echo "    <title>Systemd Journald Input for Splunk</title>"
    
    echo "    <description>This is the input that gets data from journald (systemd's logging component) into Splunk.</description>"
    
    echo "    <use_external_validation>true</use_external_validation>"
    #
    # splunk-journald.path bootstraps which command line to run for the actual 
    # mod input executiion
    ###
    echo "    <script>splunk-journald.path</script>"
    
    #
    # tells mod input framework to expect HEC/ModInputs formatted JSON to be output
    # by this mod input.  This is a specific JSON language that is able to pass
    # structured fields into splunkd, and map them to appropriate keys in PipelineData
    ###
    echo "    <streaming_mode>json</streaming_mode>"
    
    echo "    <endpoint>"
    echo "        <args>"
    echo "            <arg name="name">"
    echo "                <title>name</title>"
    echo "            </arg>"
    echo "            <arg name="journalctl-filter">"
    echo "                <title>journalctl-filter</title>"
    echo "                <required_on_create>false</required_on_create>"
    echo "                <required_on_edit>false</required_on_edit>"
    echo "            </arg>"
    echo "            <arg name="journalctl-unit">"
    echo "                <title>journalctl-unit</title>"
    echo "                <required_on_create>false</required_on_create>"
    echo "                <required_on_edit>false</required_on_edit>"
    echo "            </arg>"
    echo "            <arg name="journalctl-identifier">"
    echo "                <title>journalctl-identifier</title>"
    echo "                <required_on_create>false</required_on_create>"
    echo "                <required_on_edit>false</required_on_edit>"
    echo "            </arg>"
    echo "            <arg name="journalctl-priority">"
    echo "                <title>journalctl-priority</title>"
    echo "                <required_on_create>false</required_on_create>"
    echo "                <required_on_edit>false</required_on_edit>"
    echo "            </arg>"
    echo "            <arg name="journalctl-boot">"
    echo "                <title>journalctl-boot</title>"
    echo "                <required_on_create>false</required_on_create>"
    echo "                <required_on_edit>false</required_on_edit>"
    echo "            </arg>"
    echo "            <arg name="journalctl-facility">"
    echo "                <title>journalctl-facility</title>"
    echo "                <required_on_create>false</required_on_create>"
    echo "                <required_on_edit>false</required_on_edit>"
    echo "            </arg>"
    echo "            <arg name="journalctl-grep">"
    echo "                <title>journalctl-grep</title>"
    echo "                <required_on_create>false</required_on_create>"
    echo "                <required_on_edit>false</required_on_edit>"
    echo "            </arg>"
    echo "            <arg name="journalctl-user-unit">"
    echo "                <title>journalctl-user-unit</title>"
    echo "                <required_on_create>false</required_on_create>"
    echo "                <required_on_edit>false</required_on_edit>"
    echo "            </arg>"
    echo "            <arg name="journalctl-dmesg">"
    echo "                <title>journalctl-dmesg</title>"
    echo "                <required_on_create>false</required_on_create>"
    echo "                <required_on_edit>false</required_on_edit>"
    echo "            </arg>"
    echo "            <arg name="journalctl-quiet">"
    echo "                <title>journalctl-quiet</title>"
    echo "                <required_on_create>false</required_on_create>"
    echo "                <required_on_edit>false</required_on_edit>"
    echo "            </arg>"
    echo "            <arg name="journalctl-freetext">"
    echo "                <title>journalctl-freetext</title>"
    echo "                <required_on_create>false</required_on_create>"
    echo "                <required_on_edit>false</required_on_edit>"
    echo "            </arg>"
    echo "            <arg name="journalctl-exclude-fields">"
    echo "                <title>journalctl-exclude-fields</title>"
    echo "                <required_on_create>false</required_on_create>"
    echo "                <required_on_edit>false</required_on_edit>"
    echo "            </arg>"
    echo "            <arg name="journalctl-include-fields">"
    echo "                <title>journalctl-include-fields</title>"
    echo "                <required_on_create>false</required_on_create>"
    echo "                <required_on_edit>false</required_on_edit>"
    echo "            </arg>"
    echo "        </args>"
    echo "    </endpoint>"
    
    echo "</scheme>"
}

if [ "$#" -ne 1 ]; then
    echo 'USAGE: $0 --scheme'
    exit
fi

if [ "$1" == "--scheme" ] ; then
    do_scheme
else
    echo 'USAGE: $0 --scheme'
fi
