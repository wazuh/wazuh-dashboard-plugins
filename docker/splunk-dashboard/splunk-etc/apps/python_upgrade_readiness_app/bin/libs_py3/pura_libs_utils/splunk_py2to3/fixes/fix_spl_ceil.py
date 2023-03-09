"""
Fixer that puts math.ceil() inside float()
Possible ways to use math.ceil()
1. import math and call it as math.ceil()
2. import math as m1 and call it as m1.ceil()
3. from math import ceil and call it as ceil()
4. from math import ceil as c1 and call it as c1()
"""
from lib2to3 import patcomp, fixer_base
from lib2to3.fixer_util import Name, Call
class FixSplCeil(fixer_base.BaseFix):
    PATTERN = """
        import_name< 'import' modulename='math' >
        |
        import_name< 'import' dotted_as_name< 'math' 'as' modulename=any > >
        |
        import_from< 'from' 'math' 'import' ceilname='ceil' >
        |
        import_from< 'from' 'math' 'import' import_as_name< 'ceil' 'as' ceilname=any > >
        |
        any
        """
    def start_tree(self, tree, filename):
        super(FixSplCeil, self).start_tree(tree, filename)
        self.usage_pattern = None

    def match(self, node):
        results = {"node": node}
        match = self.pattern.match(node, results)
        if match and 'modulename' in results:
            modulename = results['modulename'].value
            self.usage_pattern = patcomp.PatternCompiler().compile_pattern(
                "power< '%s' trailer< '.' 'ceil' > any* >" % modulename)
            return False
        if match and 'ceilname' in results:
            asceilname = results['ceilname'].value
            self.usage_pattern = patcomp.PatternCompiler().compile_pattern(
                "power< '%s' any* >"%asceilname)
            return False
        if self.usage_pattern and self.usage_pattern.match(node, results):
            return results

    def transform(self, node, results):
        assert results
        power_node = results.get('node')
        outer_prefix = node.prefix
        node.prefix = ""
        node.replace(Call(Name(u"float"), [node.clone()], prefix=outer_prefix))
        return