#!/usr/bin/env python

import sys

DBUS_ADVICE = 'please verify that dbus-daemon is running and that the '        \
    'DBUS_SESSION_BUS_PID and DBUS_SESSION_BUS_ADDRESS environment '           \
    'variables are set appropriately; for example, consider '                  \
    'running "export $(dbus-launch)" in your terminal session'
IMPORT_ADVICE = 'please verify that:\n'                                        \
    '\t1. gnome-keyring-daemon and libgnome-keyring are installed\n'           \
    '\t2. site-packages for system Python include either the bindings for '    \
    'GObject introspection (pygobject*, python*-gobject, python*-gi) or '      \
    'the bindings for libgnome-keyring (gnome-python*-gnomekeyring)'

def import_advice(act):
    sys.stderr.write('Cannot %s; ' % act)
    sys.stderr.write(IMPORT_ADVICE)
    sys.stderr.write('\n')

class GnomeKeyringException(Exception):
    pass

#
# Use the traditional, deprecated (but still supported) GNOME keyring APIs.
#
#     https://developer.gnome.org/gnome-keyring/stable
#
try:
    # Use reflection-based pygobject3 bindings for GNOME keyring.
    from gi.repository import GnomeKeyring as gk
    def get_item(krname, item):
        return gk.item_get_info_full_sync(krname, item, gk.ItemInfoFlags.SECRET)
    class NoSuchKeyringError(GnomeKeyringException):
        pass
except ImportError:
    try:
        # Fall back to pygobject2 bindings for GNOME keyring.
        import gnomekeyring as gk
        def get_item(krname, item_id):
            return gk.item_get_info_sync(krname, item_id)
        NoSuchKeyringError = gk.NoSuchKeyringError
        try:
            import glib
            # Avoid: WARNING **: g_set_application_name not set.
            glib.set_application_name('splunk')
        except:
            pass
    except ImportError:
        import_advice('import pygobject2/pygobject3 bindings for GnomeKeyring')
        raise # re-raise
#
# from gi.repository import Secret
#
#     The stable API for libsecret only supports getting, setting, and removing
#     individual items with known attributes. For example, there is no way to
#     iterate over an existing collection and enumerate all existing items.
#
#     This means the stable APIs do not meet our requirements, which include
#     "generic fetch of a group of related-but-arbitrary items".
#
# from gi.repository import SecretUnstable
#
#     The unstable API does offer collection-oriented operations. However, per
#     https://people.gnome.org/~stefw/libsecret-docs/using-python.html:
#
#         Some parts of the libsecret API are not yet stable. It is not
#         recommended that you use these unstable parts from python. Your code
#         will break when the unstable API changes, and due to the lack of a
#         compiler you will have no way of knowing when it does.
#
#     In other words, we cannot use the unstable APIs either.
#

#
# XXX: Unfortunately, it appears that the Python bindings for the GLib.Array
# class provide no mutators, setters, meaningful constructors, or translations
# to native Python datastructures. As a result, instances of this class are
# essentially read-only, and we cannot even construct meaningful objects to
# pass to methods like item_create_sync().
#
# This means that we cannot make use of keyring item attributes to store extra
# information about each secret, and we cannot leverage attribute-based lookup
# of items. Instead, we must overload the label ("display name") of each item
# and implement our own "collision detection" and "item lookup". Terrible.
#
try:
    from gi.repository.GLib import Array
except ImportError:
    Array = dict

try:
    from gi.repository import GObject
    GnomeKeyringResult = GObject.GEnum
except ImportError:
    try:
        import gobject
        GnomeKeyringResult = gobject.GEnum
    except ImportError:
        import_advice('import pygobject2/pygobject3 bindings for GObject.GEnum')
        raise # re-raise

import json

DICT_LABEL = 'label'
DICT_SECRET = 'secret'
DICT_ATTRIBUTES = 'attributes'

def err(desc):
    raise GnomeKeyringException(desc)

def verify(result, action):
    ok = None
    return_if_ok = None
    if isinstance(result, tuple) and isinstance(result[0], GnomeKeyringResult):
        # <result> is a tuple containing a return code and an actual return
        # value. This is the convention for pygobject3 bindings on methods like
        # get_info_sync() and item_get_info_full_sync().
        ok = result[0]
        return_if_ok = result[1]
    elif isinstance(result, GnomeKeyringResult):
        # <result> is a bare return code. This is the convention for pygobject3
        # bindings on methods like item_delete_sync() and item_set_info_sync().
        ok = result
        return_if_ok = result
    else:
        # <result> is the return value of a successful method invocation, sans
        # return code. This is the convention for pygobject2 bindings.
        return result
    if ok == gk.Result.OK:
        return return_if_ok
    if ok == gk.Result.NO_SUCH_KEYRING:
        raise NoSuchKeyringError
    msg = gk.result_to_message(ok)
    if ok == gk.Result.IO_ERROR:
        msg += '; '
        msg += DBUS_ADVICE
    err('Cannot %s: %s' % (action, msg))

def encode_label(identifying_attributes):
    # Use each keyring item's label to store a unique ID for that item. Form
    # the ID by serializing a dict of identifying attributes to JSON.
    return json.dumps(identifying_attributes, sort_keys=True)

def decode_label(label_str):
    # Deserialize a dict of identifying attributes from a label value.
    return json.loads(label_str)

def pretty_print_label(label_str):
    d = decode_label(label_str)
    return '%s [%s] %s' % (d['file'], d['stanza'], d['attribute'])

def get_secrets(krname):
    item_ids = verify(gk.list_item_ids_sync(krname), 'list items in keyring=%s' % krname)

    result = []
    for i in item_ids:
        # Get this item's label and secret.
        item = verify(get_item(krname, i), 'access item in keyring=%s' % krname)
        # Emit this item as a standard Python object.
        tmp = {DICT_LABEL: pretty_print_label(item.get_display_name()),
               DICT_SECRET: item.get_secret(),
               DICT_ATTRIBUTES: decode_label(item.get_display_name())}
        result.append(tmp)
    return result

def set_secrets(krname, to_write, overwrite_all):
    item_ids = verify(gk.list_item_ids_sync(krname), 'list pre-existing items in keyring=%s' % krname)

    if overwrite_all:
        # Remove existing items from the keyring, leaving the container intact.
        for i in item_ids:
            verify(gk.item_delete_sync(krname, i), 'delete pre-existing item from keyring=%s' % krname)
        item_ids = []

    existing_items = {}
    for i in item_ids:
        item = verify(get_item(krname, i), 'access pre-existing item in keyring=%s' % krname)
        existing_items[item.get_display_name()] = i

    try:
        typ = gk.ItemType.GENERIC_SECRET
    except AttributeError:
        typ = gk.ITEM_GENERIC_SECRET

    # Write out new items.
    for i in to_write:
        needle = encode_label(i[DICT_ATTRIBUTES])
        secret = i[DICT_SECRET]
        label = pretty_print_label(needle)
        if needle in existing_items:
            # Matched an existing item; update it in-place.
            info = gk.ItemInfo()
            info.set_type(typ)
            info.set_display_name(needle)
            info.set_secret(secret)
            verify(gk.item_set_info_sync(krname, existing_items[needle], info), 'edit item (%s) in keyring=%s' % (label, krname))
        else:
            #
            # No existing item was present. Create a new one.
            #
            # XXX: We must pass update_if_exists=False because if we did not,
            # every item would collide with every other. In other words, we
            # would only be able to store a single item in the keyring, as we
            # are forced to use the same identifying attributes for every item
            # we create. This is because the only GLib.Array we can create is
            # the empty Array(). Awful.
            #
            item_id = verify(gk.item_create_sync(krname, typ,
                                                 display_name=needle,
                                                 attributes=Array(),
                                                 secret=secret,
                                                 update_if_exists=False),
                             'create new item (%s) in keyring=%s' % (label, krname))

def remove_secrets(krname, to_remove):
    item_ids = verify(gk.list_item_ids_sync(krname), 'list pre-existing items in keyring=%s' % krname)

    existing_items = {}
    for i in item_ids:
        item = verify(get_item(krname, i), 'access pre-existing item in keyring=%s' % krname)
        existing_items[item.get_display_name()] = i

    for i in to_remove:
        needle = encode_label(i[DICT_ATTRIBUTES])
        label = pretty_print_label(needle)
        if needle not in existing_items:
            err('Cannot find item (%s) in keyring=%s' % (label, krname))
        verify(gk.item_delete_sync(krname, existing_items[needle]), 'remove item (%s) from keyring=%s' % (label, krname))

def process(args):
    krname = args.get('namespace')
    if krname is None:
        err('No namespace (keyring name) specified')

    to_write = args.get('write', {})
    to_remove = args.get('remove', {})
    overwrite_all = args.get('overwrite', False)
    password = args.get('password')

    try:
        keyring_info = verify(gk.get_info_sync(krname), 'access keyring=%s' % krname)
    except NoSuchKeyringError:
        if password is None:
            err('Cannot create keyring=%s without a password' % krname)
        # Desired keyring does not yet exist. Create it on-demand.
        verify(gk.create_sync(krname, password), 'create keyring=%s' % krname)
        # Try to get info again, now that we have created the missing keyring.
        keyring_info = verify(gk.get_info_sync(krname), 'access keyring=%s' % krname)

    if keyring_info.get_is_locked():
        if password is None:
            err('Cannot access locked keyring=%s without a password' % krname)
        # Unlock the desired keyring.
        ok = gk.unlock_sync(krname, password)
        if ok is not None:
            # Handle pygobject3-style invocation of unlock_sync().
            if ok == gk.Result.IO_ERROR:
                # An incorrect password causes an IO_ERROR for some reason. Emit a
                # clearer error message than the default result_to_message() one.
                err('Cannot unlock keyring=%s: Invalid password' % krname)
            verify(ok, 'unlock keyring=%s' % krname)

    result = {} # By default, emit minimal valid JSON.

    if len(to_write) == 0 and len(to_remove) == 0:
        # Given nothing to write, we emit existing secrets.
        result = get_secrets(krname)

    if len(to_write) > 0:
        set_secrets(krname, to_write, overwrite_all)

    if len(to_remove) > 0:
        remove_secrets(krname, to_remove)

    json.dump(result, sys.stdout)

if __name__ == '__main__':
    args = json.load(sys.stdin) # error out on bad/empty JSON

    try:
        NoKeyringDaemonError = gk.NoKeyringDaemonError
    except AttributeError:
        NoKeyringDaemonError = GnomeKeyringException

    try:
        process(args)
    except GnomeKeyringException:
        raise # re-raise any generic exceptions
    except NoKeyringDaemonError:
        raise NoKeyringDaemonError(DBUS_ADVICE)
