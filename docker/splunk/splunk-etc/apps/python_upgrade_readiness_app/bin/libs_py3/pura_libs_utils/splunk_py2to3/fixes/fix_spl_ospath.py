"""
Change os.path.walk() -> os.walk()
Handle scenarios for the module/method renames using "as" keyword
"""

# Local imports
from lib2to3 import patcomp
from lib2to3.fixer_base import BaseFix
from lib2to3.fixer_util import Name, Call, touch_import, FromImport
from libfuturize.fixer_util import touch_import_top, NameImport

class FixSplOspath(BaseFix):
    BM_compatible = True
    PATTERN = """
        import_name< 'import' os_module_name='os' >
        |
        import_name< 'import' dotted_as_name< 'os' 'as' os_module_name=any > >
        |
        import_name< 'import' dotted_name< os_module_name='os' '.' path_module_name='path' > >
        |
        import_name< 'import' dotted_as_name< dotted_name< 'os' '.' 'path' > 'as' path_module_name=any > >
        |
        import_from< 'from' 'os' 'import' path_module_name='path' >
        |
        import_from< 'from' 'os' 'import' import_as_name< 'path' 'as' path_module_name=any > >
        |
        import_from< 'from' dotted_name< 'os' '.' 'path' > 'import' walkname='walk' >
        |
        import_from< 'from' dotted_name< 'os' '.' 'path' > 'import' import_as_name< 'walk' 'as' walkname=any > >
        |
        power< any* >
        """

    OS_PATTERN = """
        import_name< 'import' dotted_name< os_module_name='{os_module_name}' '.' path_module_name='path' > >
        |
        import_name< 'import' dotted_as_name< dotted_name< '{os_module_name}' '.' 'path' > 'as' path_module_name=any > >
        |
        import_from< 'from' os_module_name='{os_module_name}' 'import' path_module_name='path' >
        |
        import_from< 'from' os_module_name='{os_module_name}' 'import' import_as_name< 'path' 'as' path_module_name=any > >
        |
        import_from< 'from' dotted_name< '{os_module_name}' '.' 'path' > 'import' walkname='walk' >
        |
        import_from< 'from' dotted_name< '{os_module_name}' '.' 'path' > 'import' import_as_name< 'walk' 'as' walkname=any > >
        |
        power< any* >

    """

    PATH_PATTERN = """
        import_from< 'from' dotted_name< '{os_module_name}' '.' '{path_module_name}' > 'import' walkname='walk' >
        |
        import_from< 'from' dotted_name< '{os_module_name}' '.' '{path_module_name}' > 'import' import_as_name< 'walk' 'as' walkname=any > >
        |
        import_from< 'from' '{path_module_name}' 'import' walkname='walk' >
        |
        import_from< 'from' '{path_module_name}' 'import' import_as_name< 'walk' 'as' walkname=any > >
        |
        power< any* >
    """

    OS_PATH_WALK_PATTERN = """
        power< os_module_name='{os_module_name}' path_module_name=trailer< '.' '{path_module_name}' > trailer< '.' 'walk' > any* >
    """

    PATH_WALK_PATTERN = """
        power< path_module_name='{path_module_name}' trailer< '.' 'walk' > any* >
    """

    WALK_PATTERN = """
        power< '{walkname}' any* >
    """

    def start_tree(self, tree, filename):
        super(FixSplOspath, self).start_tree(tree, filename)
        self.usage_pattern = None
        self.os_module_name = None
        self.path_module_name = None
        self.walkname = None
        self.import_os = False
        self.replace_import = False

    def match(self, node):
        results = {"node": node}
        match = self.pattern.match(node, results)
        should_return = False
        
        if (match and not self.os_module_name and not 'os_module_name' in results and 'path_module_name' in results):
            # os module is not added in global scope
            # Add import os statement
            self.import_os = True

        if (match and 'walkname' in results and not self.os_module_name and not 'os_module_name' in results and not 'path_module_name' in results):
            # Replace "from os.walk import walk" to "from os import walk"
            self.replace_import = True

        if match and 'os_module_name' in results:
            self.os_module_name = results['os_module_name'].value
            if results['os_module_name'].value != 'os':
                self.pattern = patcomp.PatternCompiler().compile_pattern(
                    self.OS_PATTERN.format(os_module_name=self.os_module_name))
                should_return = True


        if match and 'path_module_name' in results:
            self.path_module_name = results['path_module_name'].value

            if results['path_module_name'].value != 'path':
                self.pattern = patcomp.PatternCompiler().compile_pattern(
                    self.PATH_PATTERN.format(os_module_name=self.os_module_name, path_module_name=self.path_module_name))
                should_return = True

        if match and 'walkname' in results:
            self.walkname = results['walkname'].value
        if should_return:
            return False
        if self.import_os or self.replace_import:
            return results
        
        if match and self.os_module_name:
            pattern = patcomp.PatternCompiler().compile_pattern(
                    self.OS_PATH_WALK_PATTERN.format(os_module_name=self.os_module_name, path_module_name=(self.path_module_name or "path")))
            if pattern.match(node, results):
                return results

        if match and self.path_module_name:
            pattern = patcomp.PatternCompiler().compile_pattern(
                    self.PATH_WALK_PATTERN.format(path_module_name=self.path_module_name))

            if pattern.match(node, results):
                return results

        if match and self.walkname:
            pattern = patcomp.PatternCompiler().compile_pattern(
                    self.WALK_PATTERN.format(walkname=self.walkname))
            if pattern.match(node, results):
                return results
        return False

    def transform(self, node, results):
        assert results

        if self.import_os:
            touch_import(None, 'os', node)
            self.import_os = False
            return

        if self.replace_import:
            import_node = results["node"]
            if self.walkname != 'walk':
                touch_import_top('os', 'walk as {}'.format(self.walkname), node)
            else:
                touch_import_top('os', 'walk', node)
            import_node.remove()
            self.replace_import = False

        if "os_module_name" in results and "path_module_name" in results:
            path_node = results["path_module_name"]
            path_node.remove()

        if "os_module_name" not in results and "path_module_name" in results:
            path_node = results["path_module_name"]
            path_node.replace(Name(self.os_module_name or "os", prefix=path_node.prefix))
        return