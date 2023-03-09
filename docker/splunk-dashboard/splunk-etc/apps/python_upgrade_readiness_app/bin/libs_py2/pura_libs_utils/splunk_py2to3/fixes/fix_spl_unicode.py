"""
Fixer that adds ``from past.builtins import basestring`` if there is a
reference to ``basestring``
"""

from lib2to3 import fixer_base

from libfuturize.fixer_util import touch_import_top


class FixSplUnicode(fixer_base.BaseFix):
    BM_compatible = True

    PATTERN = "'unicode'"

    def transform(self, node, results):
        touch_import_top(u'splunk.utils', 'unicode', node)
