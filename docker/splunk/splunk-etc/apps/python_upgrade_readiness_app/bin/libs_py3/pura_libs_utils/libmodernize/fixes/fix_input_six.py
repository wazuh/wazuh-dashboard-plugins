# This is a derived work of Lib/lib2to3/fixes/fix_input.py and
# Lib/lib2to3/fixes/fix_raw_input.py. Those files are under the
# copyright of the Python Software Foundation and licensed under the
# Python Software Foundation License 2.
#
# Copyright notice:
#
#     Copyright (c) 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010,
#     2011, 2012, 2013, 2014 Python Software Foundation. All rights reserved.
from __future__ import absolute_import

from lib2to3 import fixer_base
from lib2to3.fixer_util import Call, Name
from libmodernize import touch_import


class FixInputSix(fixer_base.ConditionalFix):

    BM_compatible = True
    order = 'pre'
    skip_on = 'six.moves.input'

    PATTERN = """
              power< (name='input' | name='raw_input')
                trailer< '(' [any] ')' > any* >
              """

    def transform(self, node, results):
        if self.should_skip(node):
            return

        touch_import(u'six.moves', u'input', node)
        name = results['name']
        if name.value == 'raw_input':
            name.replace(Name('input', prefix=name.prefix))
        else:
            new_node = node.clone()
            new_node.prefix = ''
            return Call(Name('eval'), [new_node], prefix=node.prefix)
