from __future__ import absolute_import

from lib2to3 import fixer_base
from lib2to3.fixer_util import is_probably_builtin

import libmodernize


class FixUnichr(fixer_base.ConditionalFix):
    BM_compatible = True

    skip_on = 'six.moves.unichr'
    PATTERN = """'unichr'"""

    def transform(self, node, results):
        if self.should_skip(node):
            return
        if is_probably_builtin(node):
            libmodernize.touch_import(u'six', u'unichr', node)
