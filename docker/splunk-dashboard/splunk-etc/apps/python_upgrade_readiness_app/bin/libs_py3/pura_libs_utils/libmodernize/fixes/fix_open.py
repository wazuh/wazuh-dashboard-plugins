from __future__ import absolute_import

from lib2to3 import fixer_base
import libmodernize


class FixOpen(fixer_base.BaseFix):

    BM_compatible = True
    # Fixers don't directly stack, so make sure the 'file' case is covered.
    PATTERN = """
    power< ('open' | 'file') trailer< '(' any+ ')' > >
    """

    def transform(self, node, results):
        libmodernize.touch_import(u'io', u'open', node)
