#   Version 9.0.3
#
#
# *.meta files contain ownership information, access controls, and export
# settings for Splunk objects like saved searches, event types, and views.
# Each app has its own default.meta file.

# Interaction of ACLs across app-level, category level, and specific object
# configuration:
* To access/use an object, users must have read access to:
  * the app containing the object
  * the generic category within the app (for example, [views])
  * the object itself
* If any layer does not permit read access, the object will not be accessible.

* To update/modify an object, such as to edit a saved search, users must have:
  * read and write access to the object
  * read access to the app, to locate the object
  * read access to the generic category within the app (for example, [savedsearches])
* If object does not permit write access to the user, the object will not be
  modifiable.
* If any layer does not permit read access to the user, the object will not be
  accessible in order to modify

* In order to add or remove objects from an app, users must have:
  * write access to the app
* If users do not have write access to the app, an attempt to add or remove an
  object will fail.

* By default, objects are only visible within the app in which they were created.
  To make an object available to all apps, set the object's 'export' setting to
  "system".
  * export = system

* Objects that are exported to other apps, or to system context, have no change
  to their accessibility rules.  Users must still have read access to the
  containing app, category, and object, despite the export.

# Set access controls on the app containing this metadata file.
[]
access = read : [ * ], write : [ admin, power ]
* Allow all users to read this app's contents. Unless overridden by other
  metadata, allow only admin and power users to share objects into this app.

# Set access controls on this app's views.
[views]
access = read : [ * ], write : [ admin ]
* Allow all users to read this app's views. Allow only admin users to create,
  remove, share, or unshare views in this app.

# Set access controls on a specific view in this app.
[views/index_status]
access = read : [ admin ], write : [ admin ]
* Allow only admin users to read or modify this view.

# Make this view available in all apps.
export = system
* To make this view available only in this app, set 'export = none' instead.
owner = admin
* Set admin as the owner of this view.
