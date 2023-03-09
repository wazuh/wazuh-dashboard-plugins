#   Version 9.0.3
#
#

<!--
This file describes the setup XML config and provides some examples. 

Note that setup XML is not supported in Splunk Cloud or on deployments with search head clustering.

setup.xml provides a Setup Screen that you provide to users to specify configurations
for an app. The Setup Screen is available when the user first runs the app or from the
Splunk Manager: Splunk > Manager > Apps > Actions > Set up

Place setup.xml in the app's default directory:

  $SPLUNK_HOME/etc/apps/<app>/default/setup.xml

The basic unit of work is an <input>, which is targeted to a triplet
(endpoint, entity, field) and other information used to model the data. For example
data type, validation information, name/label, etc.

The (endpoint, entity, field attributes) identifies an object where the input is
read/written to, for example:

   endpoint=saved/searches
   entity=MySavedSearch
   field=cron_schedule

The endpoint/entities addressing is relative to the app being configured. Endpoint/entity can
be inherited from the outer blocks (see below how blocks work).

Inputs are grouped together within a <block> element:

(1) blocks provide an iteration concept when the referenced REST entity is a regex

(2) blocks allow you to group similar configuration items

(3) blocks can contain <text> elements to provide descriptive text to the user.

(4) blocks can be used to create a new entry rather than edit an already existing one, set the
    entity name to "_new". NOTE: make sure to add the required field 'name' as
    an input.

(5) blocks cannot be nested

See examples below.


Block Node attributes:

endpoint - The REST endpoint relative to "https://hostname:port/servicesNS/nobody/<app-name>/"
           of entities/object the block/input addresses. Generally, an endpoint maps to a
           Splunk configuration file.

entity   - An object at the endpoint. Generally, this maps to a stanza name in a configuration file.
          NOTE: entity names should be URI encoded.

mode     - (bulk | iter) used if the entity attribute is a regular expression:

           o iter - (default value for mode) Iterate over all matching entities and provide a
                    separate input field for each.
           o bulk - Update all matching entities with the same value.

           NOTE: splunk interprets '*' as the regex '.*'

eai_search - a search to filter entities returned by an endpoint. If not specified, the following
             search is used: eai:acl.app="" OR eai:acl.app="<current-app>" This search matches
             only objects defined in the app which the setup page is being used for.

             NOTE: if objects from another app are allowed to be configured, any changes to those
                   objects will be stored in the current app.

enabled   - (true | false | in-windows | in-unix) whether this block is enabled or not
            o true          - (default) this block is enabled
            o false         - block disabled
            o in-windows    - block is enabled only in windows installations
            o in-unix       - block is enabled in non-windows installations

Input Node Attributes:

endpoint          - see description above (inherited from block)

entity            - see description above (inherited from block)

field             - <string> the field which is being configured

old_style_disable - <bool> whether to perform entity disabling by submitting the edited entity with the following
                     field set: disabled=1. (This is only relevant for inputs whose field=disabled|enabled).
                     Defaults to false.

Nodes within an <input> element can display the name of the entity and field values within the entity
on the setup screen. Specify $name$ to display the name of the entity. Use $<field_name>$ to specify
the value of a specified field.

 -->

<setup>
  <block title="Basic stuff" endpoint="saved/searches/" entity="foobar">
    <text> some description here </text>

    <input field="is_scheduled">
      <label>Enable Schedule for $name$</label>   <!-- this will be rendered as "Enable Schedule for foobar" -->
      <type>bool</type>
    </input>

    <input field="cron_scheduled">
      <label>Cron Schedule</label>
      <type>text</type>
    </input>
    <input field="actions">
      <label>Select Active Actions</label>
      <type>list</type>
    </input>

    <!-- bulk update  -->
    <input entity="*" field="is_scheduled" mode="bulk">
      <label>Enable Schedule For All</label>
      <type>bool</type>
    </input>
  </block>

  <!-- iterative update in this block -->
  <block title="Configure search" endpoint="saved/eventtypes/" entity="*" mode="iter">
    <input field="search">
      <label>$name$ search</label>
      <type>string</type>
    </input>
    <input field="disabled">
      <label>disable $name$</label>
      <type>bool</type>
    </input>
  </block>

  <block title="Create a new eventtype" endpoint="saved/eventtypes/" entity="_new">
    <input target="name">
      <label>Name</label>
      <type>text</type>
    </input>
    <input target="search">
      <label>Search</label>
      <type>text</type>
    </input>
  </block>

  <block title="Add Account Info" endpoint="storage/passwords" entity="_new">
    <input field="name">
      <label>Username</label>
      <type>text</type>
    </input>
    <input field="password">
      <label>Password</label>
      <type>password</type>
    </input>
  </block>

  <!--  example config for "Windows setup" -->
  <block title="Collect local event logs" endpoint="admin/win-eventlogs/" eai_search="" >
    <text>
      Splunk for Windows needs at least your local event logs to demonstrate how to search them.
      You can always add more event logs after the initial setup in Splunk Manager.
    </text>

    <input entity="System" field="enabled" old_style_disable="true">
      <label>Enable $name$</label>
      <type>bool</type>
    </input>
    <input entity="Security" field="enabled"  old_style_disable="true">
      <label>Enable $name$</label>
      <type>bool</type>
    </input>
    <input entity="Application" field="enabled"  old_style_disable="true">
      <label>Enable $name$</label>
      <type>bool</type>
    </input>
  </block>

  <block title="Monitor Windows update logs" endpoint="data/inputs/monitor">
    <text>
      If you monitor the Windows update flat-file log, Splunk for Windows can show your patch history.
      You can also monitor other logs if you have them, such as IIS or DHCP logs, from Data Inputs in Splunk Manager
    </text>
    <input entity="%24WINDIR%5CWindowsUpdate.log" field="enabled">
      <label>Enable $name$</label>
      <type>bool</type>
    </input>
  </block>
</setup>
	



