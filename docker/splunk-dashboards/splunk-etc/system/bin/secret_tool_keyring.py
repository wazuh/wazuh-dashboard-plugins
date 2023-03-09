#!/usr/bin/env python

import sys

import json
import subprocess

DICT_LABEL = 'label'
DICT_SECRET = 'secret'
DICT_ATTRIBUTES = 'attributes'

# Python SecretStorage requires these packages to work:
# "Jeepney, python-cryptography", which may have their own
# Common Criteria impact.
#
# Also note that the GNOME keyring Python APIs have been removed in
# RHEL8 and there are no good secret store altervatives 
# that meet Common Criteria requirements. 
# (e.g. "For Linux: The evaluator shall verify that all keys are stored using Linux keyrings")
# so just invoke secret-tool.

class KeyringException(Exception):
    pass

def err(desc):
    raise KeyringException(desc)

def read_store(krname):
   secret_tool_lookup_cmd = ['secret-tool', 'lookup', krname, 'store']
   p = subprocess.Popen(secret_tool_lookup_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
   out, err = p.communicate()
   if len(out) == 0:
       return []
   return json.loads(out.decode('utf-8'))

def write_store(store, krname):
    secret_tool_store_cmd = ['secret-tool', 'store', '--label="splunk"', krname, 'store']
    p = subprocess.Popen(secret_tool_store_cmd, stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.STDOUT)
    output = p.communicate(input=json.dumps(store).encode("utf-8"))[0]

def pretty_print_label(label_str):
    d = label_str
    return '%s [%s] %s' % (d['file'], d['stanza'], d['attribute'])

def get_secrets(store, krname):
    items = store
    result = []
    for i in items:
        # Emit this item as a standard Python object.
        tmp = {DICT_LABEL: pretty_print_label(i[DICT_ATTRIBUTES]),
               DICT_SECRET: i[DICT_SECRET],
               DICT_ATTRIBUTES: i[DICT_ATTRIBUTES]}
        result.append(tmp)
    return result

def set_secrets(store, krname, to_write, overwrite_all):
    if overwrite_all:
        existing_items = []
    else:
        existing_items = store

    for i in to_write:
       found = False
       for j in existing_items:
          if j[DICT_ATTRIBUTES] == i[DICT_ATTRIBUTES]:
             j[DICT_SECRET] = i[DICT_SECRET]
             found = True
             break
       if not found:
          existing_items.append(i)
    
    write_store(existing_items, krname)

def remove_secrets(store, krname, to_remove):
    existing_items = store
    for i in to_remove:
       for j in existing_items:
          if j[DICT_ATTRIBUTES] == i[DICT_ATTRIBUTES]:
             existing_items.remove(j)
             break

    write_store(store, krname)

def process(args):
    krname = args.get('namespace')
    if krname is None:
        err('No namespace (keyring name) specified')

    to_write = args.get('write', {})
    to_remove = args.get('remove', {})
    overwrite_all = args.get('overwrite', False)
    password = args.get('password')

    result = {} # By default, emit minimal valid JSON.
    store = read_store(krname)
    if len(to_write) == 0 and len(to_remove) == 0:
        # Given nothing to write, we emit existing secrets.
        result = get_secrets(store, krname)

    if len(to_write) > 0:
        set_secrets(store, krname, to_write, overwrite_all)

    if len(to_remove) > 0:
        remove_secrets(store, krname, to_remove)
    
    json.dump(result, sys.stdout)

if __name__ == '__main__':
    args = json.load(sys.stdin) # error out on bad/empty JSON
    process(args)
