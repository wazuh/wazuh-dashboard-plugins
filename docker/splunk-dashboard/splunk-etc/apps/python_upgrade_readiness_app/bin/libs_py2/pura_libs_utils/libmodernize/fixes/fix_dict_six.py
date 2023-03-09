"""Fixer for iterkeys() -> six.iterkeys(), and similarly for iteritems and itervalues."""
from __future__ import absolute_import

# Local imports
from lib2to3 import fixer_util
from lib2to3.fixes import fix_dict
import libmodernize


class FixDictSix(fix_dict.FixDict):

    def transform_iter(self, method_name, node, base):
        """Call six.(iter|view)items() and friends."""
        libmodernize.touch_import(None, u'six', node)
        new_node = [n.clone() for n in base]
        new_node[0].prefix = u''
        name = fixer_util.Name(u'six.' + method_name, prefix=node.prefix)
        node.replace(fixer_util.Call(name, new_node))

    def transform(self, node, results):
        method = results['method'][0]
        method_name = method.value
        if method_name in ('keys', 'items', 'values'):
            return super(FixDictSix, self).transform(node, results)
        else:
            return self.transform_iter(method_name, node, results['head'])

    def in_special_context(self, node, isiter):
        # Redefined from parent class to make "for x in d.items()" count as
        # in special context; 2to3 only counts for loops as special context
        # for the iter* methods.
        return super(FixDictSix, self).in_special_context(node, True)
