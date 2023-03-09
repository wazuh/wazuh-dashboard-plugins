#   Version 9.0.3
#
# This file configures the KV Store collections for a given app in Splunk.
#
# To learn more about configuration files (including precedence) please see
# the documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles


[<collection-name>]

enforceTypes = <boolean>
* Indicates whether to enforce data types when inserting data into the
  collection.
* When set to true, invalid insert operations fail.
* When set to false, invalid insert operations drop only the invalid field.
* Default: false

field.<name> = number|bool|string|time
* Field type for a field called <name>.
* If the data type is not provided, the data type is inferred from the provided JSON
  data type.

accelerated_fields.<name> = <json>
* Acceleration definition for an acceleration called <name>.
* Must be a valid JSON document. Invalid JSON is ignored.
* Example: 'acceleration.foo={"a":1, "b":-1}' is a compound acceleration
  that first sorts 'a' in ascending order and then 'b' in descending order.
* There are restrictions in compound acceleration. A compound acceleration
  must not have more than one field in an array. If it does, KV Store does
  not start or work correctly.
* If multiple accelerations with the same definition are in the same
  collection, the duplicates are skipped.
* If the data within a field is too large for acceleration, you see a
  warning when you try to create an accelerated field and the acceleration
  is not created.
* An acceleration is always created on the _key.
* The order of accelerations is important. For example, an acceleration of
  { "a":1, "b":1 } speeds queries on "a" and "a" + "b", but not on "b"
  alone.
* Multiple separate accelerations also speed up queries. For example,
  separate accelerations { "a": 1 } and { "b": 1 } speed up queries on
  "a" + "b", but not as well as a combined acceleration { "a":1, "b":1 }.
* Default: nothing (no acceleration)

profilingEnabled = <boolean>
* Indicates whether to enable logging of slow-running operations, as defined
  in 'profilingThresholdMs'.
* Default: false

profilingThresholdMs = <zero or positive integer>
* The threshold for logging a slow-running operation, in milliseconds.
* When set to 0, all operations are logged.
* This setting is used only when 'profilingEnabled' is "true".
* This setting affects the performance of the collection.
* Default: 1000

replicate = <boolean>
* Indicates whether to replicate this collection on indexers. When false,
  this collection is not replicated on indexers, and lookups that depend on
  this collection are not available (although if you run a lookup command
  with 'local=true', local lookups are available). When true,
  this collection is replicated on indexers.
* Default: false

replication_dump_strategy = one_file|auto
* Indicates how to store dump files. When set to one_file, dump files are
  stored in a single file. When set to auto, dump files are stored in
  multiple files when the size of the collection exceeds the value of
  'replication_dump_maximum_file_size'.
* Default: auto

replication_dump_maximum_file_size = <unsigned integer>
* Specifies the maximum file size (in KB) for each dump file when
  'replication_dump_strategy=auto'.
* If this value is larger than the value of 'concerningReplicatedFileSize'
  in distsearch.conf, the value of 'concerningReplicatedFileSize' is
  used instead.
* KV Store does not pre-calculate the size of the records to be written
  to disk, so the size of the resulting files can be affected by the
  'max_rows_in_memory_per_dump' setting from limits.conf.
* Default: 10240

type = internal_cache|undefined
* For internal use only.
* Indicates the type of data that this collection holds.
* When set to internal_cache, changing the configuration of the current
  instance between search head cluster, search head pool, or standalone
  erases the data in the collection.
* Default: undefined
