# -*- coding: utf-8 -*-
#
# Copyright (C) 2008 John Paulett (john -at- paulett.org)
# Copyright (C) 2009, 2011, 2013 David Aguilar (davvid -at- gmail.com)
# All rights reserved.
#
# This software is licensed as described in the file COPYING, which
# you should have received as part of this distribution.

"""Python library for serializing any arbitrary object graph into JSON.

.. warning::

   The jsonpickle module **is not secure**.  Only unpickle data you trust.

   It is possible to construct malicious pickle data which will **execute
   arbitrary code during unpickling**.  Never unpickle data that could have come
   from an untrusted source, or that could have been tampered with.

   Consider signing data with an HMAC if you need to ensure that it has not
   been tampered with.

   Safer deserialization approaches, such as reading the raw JSON
   directly, may be more appropriate if you are processing untrusted data.

jsonpickle can take almost any Python object and turn the object into JSON.
Additionally, it can reconstitute the object back into Python.

The object must be accessible globally via a module and must
inherit from object (AKA new-style classes).

Create an object::

    class Thing(object):
        def __init__(self, name):
            self.name = name

    obj = Thing('Awesome')

Use jsonpickle to transform the object into a JSON string::

    import jsonpickle
    frozen = jsonpickle.encode(obj)

Use jsonpickle to recreate a Python object from a JSON string::

    thawed = jsonpickle.decode(frozen)

The new object has the same type and data, but essentially is now a copy of
the original.

.. code-block:: python

    assert obj.name == thawed.name

If you will never need to load (regenerate the Python class from JSON), you can
pass in the keyword unpicklable=False to prevent extra information from being
added to JSON::

    oneway = jsonpickle.encode(obj, unpicklable=False)
    result = jsonpickle.decode(oneway)
    assert obj.name == result['name'] == 'Awesome'

.. note::

   Please see the note in the :ref:`api-docs` when serializing dictionaries
   that contain non-string dictionary keys.

"""
from __future__ import absolute_import, division, unicode_literals

# Export other names not in __all__
from .backend import JSONBackend  # noqa: F401
from .backend import json
from .handlers import register  # noqa: F401
from .handlers import unregister  # noqa: F401
from .pickler import Pickler  # noqa: F401
from .pickler import encode
from .unpickler import Unpickler  # noqa: F401
from .unpickler import decode
from .version import __version__  # noqa: F401

__all__ = ('encode', 'decode')

# register built-in handlers
__import__('jsonpickle.handlers', level=0)

# Export specific JSONPluginMgr methods into the jsonpickle namespace
set_preferred_backend = json.set_preferred_backend
set_decoder_options = json.set_decoder_options
set_encoder_options = json.set_encoder_options
load_backend = json.load_backend
remove_backend = json.remove_backend
enable_fallthrough = json.enable_fallthrough

# json.load(), loads(), dump(), dumps() compatibility
dumps = encode
loads = decode
