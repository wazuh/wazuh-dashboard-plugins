"""
Splunk AppInspect Python AST Analyzer API
"""
# system libraries
import ast
import logging
import os
import re
from collections import deque

# self defined modules
from . import ast_types, utilities
from .ast_info_query import AstInfoQuery
from .utilities import get_hash_file

logger = logging.getLogger(__name__)


class AstAnalyzer(object):
    """Immutable class, only support read operations"""

    def __init__(
        self,
        python_file_path=None,
        python_code_string=None,
        context=None,
        module_manager=None,
    ):
        """
        :param python_file_path:                code file path
        :param python_code_string:              raw code string
        :param context:                         AST context when starting traversal
        """

        # python file path
        self._module_name = (
            os.path.splitext(os.path.basename(python_file_path))[0]
            if python_file_path is not None
            else None
        )
        # module usage
        self._module_imported_usage = {}
        self._module_variable_usage = {}
        self._module_function_call_usage = {}
        self._module_function_call_return_value_usage = {}
        # other possible usage
        self._function_call_usage = {}
        self._variable_usage = {}
        self._exec_usage = set()
        self._literal_string_usage = {}
        # root ast node
        self._root_ast_node = None
        # python code lines
        self._python_code_lines = None
        # context dict, map AST node to context
        self._context_dict = {}
        # global context dict, map AST node to global context
        self._global_context_dict = {}
        # function vis set, used to avoid recursive function call
        self._function_visit_set = set()
        # exposed modules
        self._exposed_module_set = set()
        # store all ast nodes' parent ast node
        self._parent_ast_node_dict = {}
        # store all ast nodes' children ast nodes
        self._children_ast_node_dict = {}
        # subtree types dict
        self._subtree_types_dict = {}
        # cache variable parse result
        self._ast_node_to_variable = {}
        # cache call nodes' module usage
        self._call_node_to_modules = {}

        """
            Only store context for exec now, It will be used by re-parsing
        """
        self._snapshot_ast_types = type("Undefined", (), {})

        # python file path first, then python code string
        if python_file_path:
            self._parse_file(python_file_path, context, module_manager)
        elif python_code_string:
            self._parse_code(python_code_string, context, module_manager)
        else:
            raise Exception("python_file_path or python_code_string should be provided")

    # programming API

    def get_module_usage(self, module, lineno_only=False, with_context=False):
        """
        1. module imported usage
        2. module variable usage
        3. module function call return value usage
        """
        result = set()
        if module in self._module_imported_usage:
            result = result | self._module_imported_usage[module]
        if module in self._module_variable_usage:
            result = result | self._module_variable_usage[module]
        if module in self._module_function_call_return_value_usage:
            result = result | self._module_function_call_return_value_usage[module]

        return self._filter_result_list(
            list(result), lineno_only=lineno_only, with_context=with_context
        )

    def get_module_all_possible_usage(
        self, module, lineno_only=False, with_context=False
    ):
        """
        The difference between get_module_usage and get_module_all_possible_usage
        is this function will cover more scenarios
        eg: import os
            a = os.path.join('a', 'b')
            print a
        now it will regard `a` variable as `os` type and `os.path` type at the same time
        """
        result = set()
        for module_name, usage_set in iter(self._module_imported_usage.items()):
            if self._is_prefix_module(module, module_name):
                result = result | usage_set
        for module_name, usage_set in iter(self._module_variable_usage.items()):
            if self._is_prefix_module(module, module_name):
                result = result | usage_set
        for module_name, usage_set in iter(self._module_function_call_usage.items()):
            if self._is_prefix_module(module, module_name):
                result = result | usage_set
        for module_name, usage_set in iter(
            self._module_function_call_return_value_usage.items()
        ):
            if self._is_prefix_module(module, module_name):
                result = result | usage_set

        return self._filter_result_list(
            list(result), lineno_only=lineno_only, with_context=with_context
        )

    def get_module_function_call_usage(
        self,
        module_name,
        function_name=None,
        function_args=None,
        function_keywords=None,
        lineno_only=False,
        with_context=False,
        fuzzy=False,
    ):
        """
        :param fuzzy:           if fuzzy == True
                                    collect all possible function calls related to module_name and function_name
                                else
                                    find exactly function call usage
        :param function_args:
                                `{index: {'arg_values': any iterator collection here,
                                          'required': True}}`

        :param function_keywords: `{keyword_name, {'arg_values': any iterator collection here,
                                                    'required': True}}`

        eg: {0: {"arg_values": ["socket.AF_INT"], "required": True}}, it means the first argument
        is required, and the parameter should be the same AST tree structure as socket.AF_INT

        Be careful, when you want to use string as arg_values, only "'string'" could work
        Support regex match in String AST node
        """
        assert module_name not in (None, "")

        function_nodes = set()
        if module_name in self._module_function_call_usage:
            # check all function call
            for function_node in self._module_function_call_usage[module_name]:
                # use last attr or name.id as function name
                if (
                    isinstance(function_node.func, ast.Attribute)
                    and function_node.func.attr == function_name
                ) or (
                    isinstance(function_node.func, ast.Name)
                    and function_node.func.id == function_name
                ):
                    function_nodes.add(function_node)
        module_string = (
            module_name + "." + function_name
            if (function_name is not None and function_name != "")
            else module_name
        )
        if module_string in self._module_function_call_usage:
            function_nodes |= self._module_function_call_usage[module_string]

        if not fuzzy:

            def function_filter(function_node):
                module_names = self._call_node_to_modules[function_node]
                for module_name in module_names:
                    # it means this function call is only related to module_string, not exactly
                    if (
                        module_name.startswith(module_string)
                        and module_name != module_string
                    ):
                        return False
                return True

            function_nodes = [
                function_node
                for function_node in function_nodes
                if function_filter(function_node)
            ]

        result_list = []
        for function_node in function_nodes:
            if self._check_function_args(
                function_node, function_args, function_keywords
            ):
                result_list.append(function_node)
        return self._filter_result_list(
            result_list, lineno_only=lineno_only, with_context=with_context
        )

    def get_literal_string_usage(
        self, search_pattern=".*", flags=0, lineno_only=False, with_context=False
    ):
        """
        Return all AST nodes whose value is literal string and match search pattern
        """
        result_list = []
        pattern = re.compile(search_pattern, flags)
        for string, node_set in iter(self._literal_string_usage.items()):
            # partial match is accepted
            if re.search(pattern, string):
                for node in node_set:
                    result_list.append(node)
        return self._filter_result_list(
            result_list, lineno_only=lineno_only, with_context=with_context
        )

    def get_code_piece_usage(self, code_piece, lineno_only=False, with_context=False):
        """
        It is a time costly operation now. Since it is supposed to be rarely used,
        analyzer doesn't cache AST nodes in memory for efficiency improvement.

        Support regex match in String AST node

        Don't support multi-line code pieces
        """
        result_list = []
        code_ast_root = ast.parse(code_piece)
        # only handle one module sub tree
        if code_ast_root.body:
            sub_tree = code_ast_root.body[0]
            # need to expand Expr AST node
            if isinstance(sub_tree, ast.Expr):
                sub_tree = sub_tree.value
            for node in self.walk(self._root_ast_node):
                if utilities.is_same_ast_tree(node, sub_tree, node1_extra=True):
                    result_list.append(node)

        return self._filter_result_list(
            result_list, lineno_only=lineno_only, with_context=with_context
        )

    def get_variable_distribution(
        self, variable_name, lineno_only=False, with_context=False
    ):
        """
        Return all possible variable usages, return ast nodes by default
        """
        result_list = (
            list(self._variable_usage[variable_name])
            if variable_name in self._variable_usage
            else []
        )
        return self._filter_result_list(
            result_list, lineno_only=lineno_only, with_context=with_context
        )

    def get_variable_details(self, ast_node):

        # if we have parsed if before
        if ast_node in self._ast_node_to_variable:
            return self._ast_node_to_variable[ast_node]

        # if it is a basic node
        if isinstance(ast_node, ast.Str):
            return ast_types.AstVariable(
                ast_node, {ast_types.AstVariable.STRING_TYPE}, ast_node.s)

        if isinstance(ast_node, ast.JoinedStr):
            joined_str = ""
            for node in ast_node.values:
                if hasattr(node, "s"):
                    joined_str += node.s
                elif hasattr(node, "value"):
                    for value, variables in self.literal_string_usage.items():
                        for variable in variables:
                            if isinstance(node.value, ast.Subscript):
                                node.value = node.value.value
                            if hasattr(variable, "id") and hasattr(node.value, "id"):
                                if variable.id == node.value.id:
                                    joined_str += value

            return ast_types.AstVariable(
                ast_node, {ast_types.AstVariable.STRING_TYPE}, joined_str)

        if isinstance(ast_node, ast.Num):
            return ast_types.AstVariable(
                ast_node, {ast_types.AstVariable.NUMBER_TYPE}, ast_node.n
            )

        # try to parse it dynamically, but actually it won't work now
        # since no context cached for all ast nodes except ast.EXEC
        local_context, global_context = (
            self._context_dict.get(ast_node, None),
            self._global_context_dict.get(ast_node, None),
        )
        # contexts are ready
        if local_context is not None and global_context is not None:
            # switch global context temporally
            backup_global_map, self._global_map = (
                self._global_map,
                global_context,
            )
            variable = self._get_variable_from_node(ast_node, local_context)
            # recover global map
            self._global_map = backup_global_map
            return variable

        return ast_types.AstVariable(None, set())

    def get_parent_ast_node(self, ast_node):
        """
        return ast_node's parent ast node in ast tree, return None if no parent exists
        """
        return self._parent_ast_node_dict.get(ast_node, None)

    def get_ast_types_in_subtree(self, ast_node):
        """
        return all ast types included in ast_node's subtree
        """
        return self._subtree_types_dict.get(ast_node, set())

    def get_ast_nodes_lca(self, ast_nodes, target_type):
        """
        If ast_nodes share same ancestor with given ast node type, return this AST-nodes.
        Otherwise return None
        """
        assert issubclass(target_type, ast.AST)

        check_nodes = set()
        chain_lengths = []
        # Filter None nodes first, they won't be involved in LCA check
        ast_nodes = list(filter(lambda node: node is not None, ast_nodes))
        min_length = -1
        for node in ast_nodes:
            length = self._get_parent_chain_length(node)
            chain_lengths.append(length)
            min_length = length if min_length < 0 else min(min_length, length)

        for index, node in enumerate(ast_nodes):
            diff_length = chain_lengths[index] - min_length
            for _ in range(diff_length):
                node = self._parent_ast_node_dict[node]
            # it could not be None
            check_nodes.add(node)

        # check from check_nodes
        while len(check_nodes) > 1:
            next_check_nodes = set()
            for node in check_nodes:
                parent_node = self._parent_ast_node_dict.get(node, None)
                if parent_node is not None:
                    next_check_nodes.add(parent_node)
            check_nodes = next_check_nodes

        if len(check_nodes) == 1:
            # find first node match given ast_type
            node = check_nodes.pop()
            while node is not None and not isinstance(node, target_type):
                node = self._parent_ast_node_dict.get(node, None)
            return node

        return None

    def is_in_same_code_block(self, nodes):
        """
        check if all nodes belong to same code block
        """
        if hasattr(nodes, "__iter__"):
            common_ancestor = None
            for node in nodes:
                parent_node = node
                while parent_node and not hasattr(parent_node, "body"):
                    parent_node = self.get_parent_ast_node(parent_node)
                if parent_node:
                    if common_ancestor and (common_ancestor != parent_node):
                        return False
                    common_ancestor = parent_node
                else:
                    return False
            return True

        raise Exception("nodes should be iterable")

    def get_code_block(self, node):
        """
        return current node's code block node
        """
        while node and not hasattr(node, "body"):
            node = self.get_parent_ast_node(node)
        return node

    def get_call_node_modules(self, call_node):
        """
        return all possible modules belong to this call node in run time
        """
        return self._call_node_to_modules.get(call_node, set())

    def query(self):
        # share necessary data with query, since we want to save space usage
        return AstInfoQuery(
            self._root_ast_node, self._parent_ast_node_dict, self._subtree_types_dict
        )

    @property
    def exec_usage(self):
        """
        Exec AST nodes and corresponding context are returned.
        They could be used by ast_analyzer again
        @:return (ast_node, context)
        """
        return self._exec_usage

    @property
    def function_call_usage(self):
        """
        All normal function call usage
        """
        return self._function_call_usage

    @property
    def literal_string_usage(self):
        """
        All literal string usage
        """
        return self._literal_string_usage

    @property
    def variable_usage(self):
        """
        All variables usage
        """
        return self._variable_usage

    @property
    def context_dict(self):
        """
        context dict for all AST node, node -> context
        """
        return self._context_dict

    @property
    def global_context_dict(self):
        """
        global context dict for all AST node, node -> global context
        """
        return self._global_context_dict

    @property
    def exposed_module_set(self):
        """
        all modules mentioned in `__all__` attribute
        """
        return self._exposed_module_set

    @property
    def module(self):
        return self._module

    @property
    def root_ast_node(self):
        return self._root_ast_node

    @property
    def python_code_lines(self):
        return self._python_code_lines

    @property
    def module_manager(self):
        return self._module_manager

    @property
    def content_hash(self):
        return self._content_hash

    @content_hash.setter
    def content_hash(self, content_hash_value):
        self._content_hash = content_hash_value

    # parse functions

    def _parse_file(self, python_file_path, context=None, module_manager=None):

        with open(python_file_path, "rb") as f:
            self._content_hash = get_hash_file(f.read())

        try:
            python_code_string = open(
                python_file_path, "r", encoding="utf-8-sig"
            ).read()
        except UnicodeDecodeError:
            import chardet

            byte_array = open(python_file_path, "rb").read()
            encoding = chardet.detect(byte_array)["encoding"]
            python_code_string = byte_array.decode(encoding=encoding)

        self._parse_code(python_code_string, context, module_manager)

    def _parse_code(self, python_code_string, context=None, module_manager=None):

        if not hasattr(self, "_content_hash"):
            self._content_hash = get_hash_file(python_code_string.encode("utf-8"))

        # sometimes we need to tackle python code string...
        self._python_code_lines = python_code_string.splitlines()
        self._root_ast_node = ast.parse(python_code_string)
        init_context = (
            ast_types.AstContext(0, self._root_ast_node) if context is None else context
        )
        # module manager, used to load module
        self._module_manager = module_manager

        self._prev_traverse()
        self._traverse_ast(self._root_ast_node, init_context)
        self._post_traverse()

    def _prev_traverse(self):

        # global namespace
        self._global_map = {}
        # builtin namespace
        builtin_functions = [
            getattr(ast_types, function_name)()
            for function_name in dir(ast_types)
            if function_name.startswith("AstBuiltin")
            and function_name != "AstBuiltinFunction"
        ]
        self._builtin_map = {
            builtin_function.name: ast_types.AstVariable(
                None,
                # both `builtin` and function names would be included here
                {
                    ast_types.AstVariable.BUILTIN_TYPE,
                    ast_types.AstVariable.BUILTIN_TYPE + "." + builtin_function.name,
                },
                builtin_function,
            )
            for builtin_function in builtin_functions
        }
        # preload some modules
        self._global_map["__builtins__"] = ast_types.AstModule("__builtins__")
        for builtin_function in builtin_functions:
            self._global_map["__builtins__"].global_map[
                builtin_function.name
            ] = builtin_function

        self.gather_metadata(self._root_ast_node)

    def _post_traverse(self):

        # refine variable usage set
        for _, usage_set in iter(self._variable_usage.items()):
            remove_set = set()
            for node in usage_set:
                # if this node is ast.Call, it is a false positive
                if isinstance(node, ast.Call):
                    remove_set.add(node)
                    # remove func node also
                    remove_set.add(node.func)
                if not isinstance(node, (ast.Name, ast.Attribute)):
                    remove_set.add(node)
            usage_set -= remove_set
        # remove default imported modules
        del self._global_map["__builtins__"]

        # check if __all__ attribute exists
        # use __all__ to filter global map
        if "__all__" in self._global_map:
            variable = self._global_map["__all__"]
            # __all__ = ['a' , 'b'], __all__ = ('a' , 'b')
            if isinstance(variable.variable_value_node, (ast.List, ast.Tuple)):
                has_missed = False
                for node in variable.variable_value_node.elts:
                    variable = self.get_variable_details(node)
                    if ast_types.AstVariable.is_string(variable):
                        self._exposed_module_set.add(variable.variable_value)
                    else:
                        has_missed = True
                        break
                if has_missed:
                    self._exposed_module_set = set(self._global_map.keys())
            # unsupported data structure, expose all modules
            else:
                self._exposed_module_set = set(self._global_map.keys())
        else:
            # expose all modules by default
            self._exposed_module_set = set(self._global_map.keys())

        self._module = ast_types.AstModule(self._module_name, self._global_map)

    # visit functions

    def _traverse_ast(self, ast_root, context):  # noqa: C901
        stack = deque([ast_root])
        while stack:
            node = stack.pop()

            if isinstance(node, ast.AST):
                self._prev_visit(node, context)

            # enter class block
            if isinstance(node, ast.ClassDef):
                class_context = context.copy()
                class_context.level += 1
                class_context.root_node = node
                class_context.parent_context = context
                class_context.namespace = (
                    node.name
                    if class_context.namespace == ""
                    else class_context.namespace + "." + node.name
                )

                self._traverse_ast(node.body, class_context)
            # enter function block or async function block
            elif isinstance(node, ast.FunctionDef) or (
                isinstance(node, ast.AsyncFunctionDef)
            ):
                # if we have visited this function before, just skip this function call. Since we can not detect issues in recursive function call
                if node in self._function_visit_set:
                    continue
                self._function_visit_set.add(node)

                # traverse args to collect necessary information
                self._traverse_ast(node.args, context)
                # collect variable name usage in function default parameters
                for param_node in node.args.defaults:
                    self._gather_variable_names_in_ast_tree(param_node, context)

                function_context = context.copy()
                function_context.level += 1
                function_context.root_node = node
                function_context.parent_context = context
                function_context.namespace = (
                    node.name
                    if function_context.namespace == ""
                    else function_context.namespace + "." + node.name
                )

                # add arguments to local variable
                args, default_args = node.args.args, node.args.defaults
                for arg in list(filter(lambda arg: isinstance(arg, ast.arg), args)):
                    function_context.variable_map[arg.arg] = ast_types.AstVariable(
                        arg, set(), None
                    )
                for arg, default_arg in list(
                    filter(
                        lambda tuple_result: isinstance(tuple_result[0], ast.arg),
                        zip(reversed(args), reversed(default_args)),
                    )
                ):
                    default_variable = self._get_variable_from_node(
                        default_arg, context
                    )
                    # collect default_arg's module usage
                    self._update_inverted_index_dict_with_key_set(
                        default_variable.variable_type_set,
                        default_arg,
                        self._module_variable_usage,
                    )
                    function_context.variable_map[arg.arg] = default_variable

                # global function
                if isinstance(context.root_node, ast.Module):
                    self._global_map[
                        function_context.namespace
                    ] = ast_types.AstFunction(
                        node.name, node, ast_types.AstVariable(None, set(), None)
                    )
                # function in function
                elif isinstance(context.root_node, ast.FunctionDef):
                    context.variable_map[node.name] = ast_types.AstVariable(
                        node,
                        {ast_types.AstVariable.FUNCTION_TYPE},
                        ast_types.AstFunction(
                            node.name, node, ast_types.AstVariable(None, set(), None)
                        ),
                        node.name,
                    )

                self._traverse_ast(node.body, function_context)

                self._function_visit_set.remove(node)
            # enter if block
            elif isinstance(node, ast.If):
                current_context_mode = context.context_mode
                # in collect mode, collect all possible modules for each variables
                context.context_mode = ast_types.AstContext.COLLECT_MODE

                self._traverse_ast(node.test, context)
                self._traverse_ast(node.body, context)
                self._traverse_ast(node.orelse, context)

                context.context_mode = current_context_mode
            # enter exception handler block
            elif isinstance(node, ast.ExceptHandler):
                # just a isolated context when meeting exception handler
                exception_context = context.copy()
                node_name_string, node_type_string = (
                    node.name,
                    utilities.get_name_from_attribute_chain(node.type),
                )
                # if we can parse exception
                if node_name_string and node_type_string:
                    exception_context.variable_map[
                        node_name_string
                    ] = ast_types.AstVariable(node, {node_type_string})
                self._traverse_ast(node.body, exception_context)
            else:
                if isinstance(node, list):
                    if isinstance(context.root_node, ast.ClassDef):
                        function_nodes = list(
                            filter(lambda node: isinstance(node, ast.FunctionDef), node)
                        )
                        other_nodes = list(
                            filter(
                                lambda node: not isinstance(node, ast.FunctionDef), node
                            )
                        )
                        # visit all variable node first
                        for child_node in other_nodes:
                            self._traverse_ast(child_node, context)

                        # add context to global_map without visiting function nodes
                        function_dict = {
                            function_node.name: ast_types.AstFunction(
                                function_node.name,
                                function_node,
                                ast_types.AstVariable(None, set(), None),
                            )
                            for function_node in function_nodes
                        }

                        ast_class = None
                        if context.parent_context is not None:
                            if isinstance(context.parent_context.root_node, ast.Module):
                                self._global_map[
                                    context.namespace
                                ] = ast_types.AstClass(
                                    context.root_node.name,
                                    context.copy(),
                                    function_dict,
                                )
                                ast_class = self._global_map[context.namespace]
                            else:
                                context.parent_context.variable_map[
                                    context.root_node.name
                                ] = ast_types.AstVariable(
                                    context.root_node,
                                    {ast_types.AstVariable.CLASS_TYPE},
                                    ast_types.AstClass(
                                        context.root_node.name,
                                        context.copy(),
                                        function_dict,
                                    ),
                                )
                                ast_class = context.parent_context.variable_map[
                                    context.root_node.name
                                ].variable_value

                        if ast_class:
                            # check base class, inherit variable and methods
                            # 1. override if occur both in base class and current class
                            # 2. choose first occurrence when same variable or function inherited from different base class
                            for base_class in context.root_node.bases:
                                # take all base classes into account
                                self._gather_variable_names_in_ast_tree(
                                    base_class, context
                                )
                                self._traverse_ast(base_class, context)

                                base_class_obj = self._get_variable_from_node(
                                    base_class, context
                                )
                                if ast_types.AstVariable.is_class_instance(
                                    base_class_obj
                                ):
                                    base_class_obj = base_class_obj.variable_value
                                # now only support class inheritance
                                if isinstance(base_class_obj, ast_types.AstClass):
                                    # copy variable if not exists
                                    for variable_name, variable in iter(
                                        base_class_obj.class_context.variable_map.items()
                                    ):
                                        if (
                                            variable_name
                                            not in ast_class.class_context.variable_map
                                        ):
                                            ast_class.class_context.variable_map[
                                                variable_name
                                            ] = variable
                                    # copy function if not exists
                                    for function_name, function_variable in iter(
                                        base_class_obj.function_dict.items()
                                    ):
                                        if function_name not in ast_class.function_dict:
                                            ast_class.function_dict[
                                                function_name
                                            ] = function_variable
                                    self._update_inverted_index_dict_with_key_set(
                                        base_class_obj.modules,
                                        base_class,
                                        self._module_variable_usage,
                                    )
                                    # if we load this class from external
                                    if base_class_obj.namespace is not None:
                                        names = base_class_obj.namespace.split(".")
                                        for i in range(len(names)):
                                            name_prefix = ".".join(names[: i + 1])
                                            self._update_inverted_index_dict(
                                                name_prefix,
                                                base_class,
                                                self._module_variable_usage,
                                            )
                                            ast_class.modules.add(name_prefix)
                                    ast_class.modules |= base_class_obj.modules
                                # if class_name is not user-defined class, regard it as a module and add it to global map
                                else:
                                    all_modules = self._get_modules_used_in_ast_tree(
                                        base_class, context
                                    )
                                    # if modules could be found in base_class
                                    if all_modules:
                                        self._gather_module_variable_usage_in_ast_tree(
                                            base_class, context
                                        )
                                        ast_class.modules |= all_modules
                                    else:
                                        nodes, strings = [], []
                                        has_func = set()
                                        current_node = base_class
                                        while hasattr(current_node, "value") or hasattr(
                                            current_node, "func"
                                        ):
                                            if isinstance(
                                                current_node, (ast.Name, ast.Attribute)
                                            ):
                                                nodes.append(current_node)
                                                strings.append(
                                                    utilities.get_node_name_or_attr(
                                                        current_node
                                                    )
                                                )
                                            if hasattr(current_node, "value"):
                                                current_node = current_node.value
                                            else:
                                                current_node = current_node.func
                                                has_func.add(current_node)
                                        if isinstance(current_node, ast.Name):
                                            nodes.append(current_node)
                                            strings.append(
                                                utilities.get_node_name_or_attr(
                                                    current_node
                                                )
                                            )
                                            nodes.reverse()
                                            strings.reverse()
                                            for index in range(len(nodes)):
                                                module_string = ".".join(
                                                    strings[: index + 1]
                                                )
                                                self._update_inverted_index_dict(
                                                    module_string,
                                                    nodes[index],
                                                    self._module_variable_usage,
                                                )
                                                ast_class.modules.add(module_string)
                                                # when call node found, break attribute chain
                                                if nodes[index] in has_func:
                                                    break

                            # then all function nodes
                            init_function_names = ["__init__"]
                            init_functions = list(
                                filter(
                                    lambda func: func.name in init_function_names,
                                    function_nodes,
                                )
                            )
                            other_functions = list(
                                filter(
                                    lambda func: func.name not in init_function_names,
                                    function_nodes,
                                )
                            )

                            # share environment between init functions
                            for child_node in init_functions:
                                self._traverse_ast(child_node, ast_class.class_context)
                            # use isolated environment in each function
                            for child_node in other_functions:
                                self._traverse_ast(
                                    child_node, ast_class.class_context.copy()
                                )
                    else:
                        # if it is not in class, visit all nodes one by one
                        # it could be in a if block, a module block
                        for child_node in node:
                            self._traverse_ast(child_node, context)
                else:
                    # share the same context
                    self._visit_node(node, context)
                    stack.extend(
                        list(
                            reversed(
                                [
                                    child_node
                                    for child_node in self.iter_child_nodes(node)
                                ]
                            )
                        )
                    )

            if isinstance(node, ast.AST):
                self._post_visit(node, context)

    def _prev_visit(self, node, context):

        # Here snapshot_ast_types only contain ast.Exec
        if isinstance(node, self._snapshot_ast_types):
            self._context_dict[node] = self._local_context_snapshot(context)
            self._global_context_dict[node] = self._global_map_snapshot()

    def _post_visit(self, node, context):

        pass

    def _visit_constant_node(self, node, context):
        # Changed in version 3.8: Class ast.Constant is now used for all constants.
        # Deprecated since version 3.8: Old classes ast.Num, ast.Str, ast.Bytes,
        # ast.NameConstant and ast.Ellipsis are still available, but they will be
        # removed in future Python releases. In the meanwhile, instantiating them
        # will return an instance of a different class.
        self._collect_literal_string_usage(node, context)
        self._collect_sensitive_string_usage(node, context)

    def _visit_node(self, node, context):

        node_class = node.__class__.__name__.lower()
        method_name = "_visit_{node_class}_node".format(node_class=node_class)
        visitor = getattr(self, method_name, self._generic_visit_node)
        visitor(node, context)

    def _generic_visit_node(self, node, context):

        if not issubclass(node.__class__, ast.AST):
            raise Exception("unexpected node type, {node}".format(node=type(node)))

    # related to module import
    def _visit_import_node(self, node, context):
        """
        1. `import a`
        2. `import a as b, c as d`
        3. `import a.x`
        4. `import a.b as c`
        """
        for alias_node in node.names:
            # import a as b
            if alias_node.asname is not None:
                self._collect_modules_import_usage(
                    alias_node.name, node, context, alias_node.asname
                )
            else:
                # import a
                self._collect_modules_import_usage(alias_node.name, node, context)

    def _visit_importfrom_node(self, node, context):
        """
        1. `from a import b, c`
        2. `from a import b as c
        3. `__import__` will be handled in ast.Call node
        4. `from . import a
        """
        # replace node.module with self-defined function
        module_name = utilities.get_from_import_module_name(
            node, self._python_code_lines
        )
        # from . import b as c
        for module in node.names:
            # special check for . from module, don't need to concatenate it with .
            if list(filter(lambda ch: ch != ".", module_name)) == []:
                module_string = module_name + module.name
            else:
                module_string = module_name + "." + module.name
            # from x import a as b
            if module.asname is not None:
                self._collect_modules_import_usage(
                    module_string, node, context, alias_name=module.asname
                )
            else:
                # from x import a
                self._collect_modules_import_usage(module_string, node, context)

    def _collect_modules_import_usage(  # noqa: C901
        self, module_string, node, context, alias_name=None
    ):

        # from xx import xx
        is_import_from = isinstance(node, ast.ImportFrom)

        # special check for builtin import, since it is a standard import
        if not is_import_from and module_string == "__builtin__":
            # it is in global context
            if self._is_in_global_context(context):
                self._global_map["__builtin__"] = ast_types.AstModule("__builtin__")
                for function_name, builtin_function in iter(self._builtin_map.items()):
                    self._global_map["__builtin__"].global_map[
                        function_name
                    ] = builtin_function
            else:
                # it is in local context
                context.variable_map["__builtin__"] = ast_types.AstModule("__builtin__")
                for function_name, builtin_function in iter(self._builtin_map.items()):
                    context.variable_map["__builtin__"].global_map[
                        function_name
                    ] = builtin_function
            return

        # special check for builtins import
        if not is_import_from and module_string == "builtins":
            # it is in global context
            if self._is_in_global_context(context):
                self._global_map["builtins"] = ast_types.AstModule("builtins")
                for function_name, builtin_function in iter(self._builtin_map.items()):
                    self._global_map["builtins"].global_map[
                        function_name
                    ] = builtin_function
            else:
                # it is in local context
                context.variable_map["builtins"] = ast_types.AstModule("builtins")
                for function_name, builtin_function in iter(self._builtin_map.items()):
                    context.variable_map["builtins"].global_map[
                        function_name
                    ] = builtin_function
            return

        # If we have module manager, just use it
        if self._module_manager:
            # we only need to load one module
            if alias_name:
                # deep copy here, avoid possible issues
                modules = self._module_manager.load_modules(module_string)
                if modules:
                    assert (
                        len(modules) == 1
                    ), "load more than one modules when alias name is exists"
                    module = modules[0].copy()
                    self._store_attribute_in_current_context(
                        alias_name, module, node, context
                    )
                    self._collect_module_usage_in_external_module(module, node)
                    return
            else:
                if is_import_from:
                    # from a import b
                    modules = self._module_manager.load_modules(module_string)
                    # If modules exist
                    if modules:
                        for module in modules:
                            copy_module = module.copy()
                            self._store_attribute_in_current_context(
                                copy_module.name, copy_module, node, context
                            )
                            self._collect_module_usage_in_external_module(
                                copy_module, node
                            )
                        return
                else:
                    # import a.b, import a
                    # Now we just need to import a
                    base_module_name = module_string.strip(".").split(".")[0]
                    modules = self._module_manager.load_modules(base_module_name)
                    if modules:
                        assert (
                            len(modules) == 1
                        ), "load more than one modules when using `import statement`"
                        module = modules[0].copy()
                        self._store_attribute_in_current_context(
                            base_module_name, module, node, context
                        )
                        self._collect_module_usage_in_external_module(module, node)
                        return

        # namespace name will be used as map's key
        namespace_name = alias_name
        if alias_name is None:
            # from import
            if is_import_from:
                namespace_name = module_string.strip(".").split(".")[-1]
            else:
                namespace_name = module_string.strip(".").split(".")[0]

        # collect all possible modules related to this `import`
        module_names = set()
        module_name_array = module_string.strip(".").split(".")
        for index, _ in enumerate(module_name_array):
            module_name = ".".join(module_name_array[: index + 1])
            module_names.add(module_name)

        # Could not handle it, regard it as system libraries.
        # Here I don't build module relationship between module and referred modules
        # since the base_module_name is what we care about only
        key = namespace_name
        if alias_name:
            key = alias_name
        if self._is_in_global_context(context):
            if (
                context.context_mode == ast_types.AstContext.COLLECT_MODE
                and key in self._global_map
                and isinstance(self._global_map[key], ast_types.AstVariable)
            ):
                self._global_map[key].variable_type_set |= module_names
            else:
                self._global_map[key] = ast_types.AstVariable(
                    node, module_names, None, key
                )
        else:
            if (
                context.context_mode == ast_types.AstContext.COLLECT_MODE
                and key in context.variable_map
                and isinstance(context.variable_map[key], ast_types.AstVariable)
            ):
                context.variable_map[key].variable_type_set |= module_names
            else:
                context.variable_map[key] = ast_types.AstVariable(
                    node, module_names, None, key
                )

        self._update_inverted_index_dict_with_key_set(
            module_names, node, self._module_imported_usage
        )

    def _visit_call_node(self, node, context):

        # in function call, collect all useful information
        self._gather_info_in_common_ast_tree(node, context)
        # collect function call side effects
        modules = self._get_modules_used_in_ast_name_and_attribute_chain(node, context)
        self._update_inverted_index_dict_with_key_set(
            modules, node, self._module_function_call_return_value_usage
        )
        # now `a()()` is supported
        if isinstance(node.func, (ast.Attribute, ast.Name, ast.Call)):
            module_names = self._get_modules_used_in_ast_name_and_attribute_chain(
                node.func, context
            )
            self._update_inverted_index_dict_with_key_set(
                module_names, node, self._module_function_call_usage
            )
            # update call node to module usage dict
            self._call_node_to_modules[node] = module_names
            # It is a normal function call, use last attribute or name as function name
            if not module_names and isinstance(node.func, (ast.Attribute, ast.Name)):
                function_call = (
                    node.func.attr
                    if isinstance(node.func, ast.Attribute)
                    else node.func.id
                )
                self._update_inverted_index_dict(
                    function_call, node, self._function_call_usage
                )

    def _visit_assign_node(self, node, context):
        """
        `a = b` will have only one targets
        `a = b = c` will have many targets, but they share the same node.value
        """
        for target_node in node.targets:
            self._visit_variable_node_and_value_node(target_node, node.value, context)

    def _visit_with_node(self, node, context):

        for item in node.items:
            self._handle_with_item(item, context)

    def _handle_with_item(self, node, context):
        if node.optional_vars is not None and node.context_expr is not None:
            if isinstance(node.optional_vars, ast.Name):
                variable = self._get_variable_from_node(node.context_expr, context)
                context.variable_map[node.optional_vars.id] = variable
                self._update_inverted_index_dict(
                    node.optional_vars.id, node.optional_vars, self._variable_usage
                )
                self._ast_node_to_variable[
                    node.optional_vars
                ] = self._get_variable_from_node(node.context_expr, context)
            elif isinstance(node.optional_vars, ast.Tuple):
                for target_node in filter(
                    lambda node: isinstance(node, ast.Name), node.optional_vars.elts
                ):
                    variable = self._get_variable_from_node(node.context_expr, context)
                    context.variable_map[target_node.id] = variable
                    self._update_inverted_index_dict(
                        target_node.id, target_node, self._variable_usage
                    )
                    self._ast_node_to_variable[target_node] = variable

    def _visit_set_node(self, node, context):

        self._gather_info_in_common_ast_tree(node, context)

    def _visit_list_node(self, node, context):

        self._gather_info_in_common_ast_tree(node, context)

    def _visit_dict_node(self, node, context):

        # gather information from value nodes only
        for value_node in node.values:
            self._gather_info_in_common_ast_tree(value_node, context)

    def _visit_exec_node(self, node, context):

        self._exec_usage.add(node)

    def _visit_print_node(self, node, context):

        if node.dest is not None:
            self._gather_info_in_common_ast_tree(node.dest, context)
            self._traverse_ast(node.dest, context)

        for variable_node in node.values:
            self._gather_info_in_common_ast_tree(variable_node, context)
            self._traverse_ast(variable_node, context)

    def _visit_subscript_node(self, node, context):

        self._gather_info_in_common_ast_tree(node, context)

    def _visit_lambda_node(self, node, context):

        self._gather_info_in_common_ast_tree(node, context)

    def _visit_eq_node(self, node, context):

        self._gather_info_in_common_ast_tree(node, context)

    def _visit_compare_node(self, node, context):

        self._gather_info_in_common_ast_tree(node, context)

    def _visit_boolop_node(self, node, context):

        self._gather_info_in_common_ast_tree(node, context)

    def _visit_unaryop_node(self, node, context):

        self._gather_info_in_common_ast_tree(node, context)

    def _visit_yield_node(self, node, context):
        """yield xxx"""
        self._visit_return_node(node, context)

    def _visit_return_node(self, node, context):
        # return xxx
        if node.value is not None:
            # collect variable names
            self._gather_variable_names_in_ast_tree(node.value, context)
            ast_variable = self._get_variable_from_node(node.value, context)
            # only handle return or yield in function node
            if isinstance(context.root_node, ast.FunctionDef):
                # it is a possible class function
                if (context.parent_context is not None) and (
                    isinstance(context.parent_context.root_node, ast.ClassDef)
                ):
                    # check context first
                    function_name = context.root_node.name
                    class_name = context.parent_context.root_node.name
                    class_context = context.parent_context.parent_context
                    if (
                        class_context is not None
                        and class_name in class_context.variable_map
                        and ast_types.AstVariable.is_class_instance(
                            class_context.variable_map[class_name]
                        )
                        and function_name
                        in class_context.variable_map[
                            class_name
                        ].variable_value.function_dict
                    ):
                        function = class_context.variable_map[
                            class_name
                        ].variable_value.function_dict[function_name]
                        temp_variable_type_set = (
                            function.return_value.variable_type_set
                            - set(ast_types.AstVariable.SPECIAL_TYPES)
                        )
                        function.return_value = ast_variable
                        function.return_value.variable_type_set |= (
                            temp_variable_type_set
                        )
                    else:
                        if class_name in self._global_map and isinstance(
                            self._global_map[class_name], ast_types.AstClass
                        ):
                            class_obj = self._global_map[class_name]
                            if function_name in class_obj.function_dict:
                                temp_variable_type_set = class_obj.function_dict[
                                    function_name
                                ].return_value.variable_type_set - set(
                                    ast_types.AstVariable.SPECIAL_TYPES
                                )
                                class_obj.function_dict[
                                    function_name
                                ].return_value = ast_variable
                                class_obj.function_dict[
                                    function_name
                                ].return_value.variable_type_set |= (
                                    temp_variable_type_set
                                )
                else:
                    function_name = context.root_node.name
                    if context.parent_context is not None and isinstance(
                        context.parent_context.root_node, ast.Module
                    ):
                        if function_name in self._global_map and isinstance(
                            self._global_map[function_name], ast_types.AstFunction
                        ):
                            temp_variable_type_set = self._global_map[
                                function_name
                            ].return_value.variable_type_set - set(
                                ast_types.AstVariable.SPECIAL_TYPES
                            )
                            self._global_map[function_name].return_value = ast_variable
                            self._global_map[
                                function_name
                            ].return_value.variable_type_set |= temp_variable_type_set
                    elif (
                        context.parent_context is not None
                        and function_name in context.parent_context.variable_map
                        and ast_types.AstVariable.is_function(
                            context.parent_context.variable_map[function_name]
                        )
                    ):
                        temp_variable_type_set = context.parent_context.variable_map[
                            function_name
                        ].variable_value.return_value.variable_type_set - set(
                            ast_types.AstVariable.SPECIAL_TYPES
                        )
                        context.parent_context.variable_map[
                            function_name
                        ].variable_value.return_value = ast_variable
                        context.parent_context.variable_map[
                            function_name
                        ].variable_value.return_value.variable_type_set |= (
                            temp_variable_type_set
                        )

    def _visit_delete_node(self, node, context):

        for target in node.targets:
            # only support variable name
            name_list = utilities.get_name_list_from_attribute_chain(target)
            if name_list:
                # local context map as default
                current_map = context.variable_map
                if name_list[0] in self._global_map:
                    current_map = self._global_map
                elif name_list[0] in self._builtin_map:
                    current_map = self._builtin_map
                for index, name in enumerate(name_list):
                    if name in current_map:
                        if index == len(name_list) - 1:
                            del current_map[name]
                        else:
                            current_variable = current_map[name]
                            current_map = self._get_variable_namespace(current_variable)
                            if not current_map:
                                break

    def _visit_global_node(self, node, context):

        if not self._is_in_global_context(context):
            for name in node.names:
                # copy variable from global to local
                if name in self._global_map:
                    context.variable_map[name] = self._global_map[name].copy()
                else:
                    # dummy variable
                    context.variable_map[name] = ast_types.AstVariable(None, set())

    def _visit_for_node(self, node, context):
        # it is another type of assignation
        self._visit_variable_node_and_value_node(node.target, node.iter, context)

    def _visit_str_node(self, node, context):

        # TODO Possible encoding issue is as follow, but it is not a blocking issue
        # `UnicodeWarning: Unicode equal comparison failed to convert both arguments to Unicode - interpreting them as being unequal`
        self._collect_literal_string_usage(node, context)
        self._collect_sensitive_string_usage(node, context)

    def _visit_name_node(self, node, context):

        self._collect_literal_string_usage(node, context)
        self._collect_sensitive_string_usage(node, context)

    def _visit_attribute_node(self, node, context):

        self._collect_literal_string_usage(node, context)
        self._collect_sensitive_string_usage(node, context)

    def _visit_binop_node(self, node, context):

        self._collect_literal_string_usage(node, context)
        self._collect_sensitive_string_usage(node, context)

        # store variable here for literal string
        variable = self._get_variable_from_node(node, context)
        self._ast_node_to_variable[node] = variable

    # Python3 syntax visitor

    def _visit_await_node(self, node, context):
        self._gather_info_in_common_ast_tree(node.value, context)

    # helper functions

    def _gather_info_in_common_ast_tree(self, node, context):
        """
        all common ast nodes' information are gathered here
        """
        # gather module variable usage
        self._gather_module_variable_usage_in_ast_tree(node, context)
        # gather variable usage
        self._gather_variable_names_in_ast_tree(node, context)

    def _gather_module_variable_usage_in_ast_tree(self, node, context):

        for ast_node in self.walk(node):
            # only watch name and attribute ast nodes
            if isinstance(ast_node, (ast.Name, ast.Attribute)):
                module_names = self._get_modules_used_in_ast_name_and_attribute_chain(
                    ast_node, context
                )
                self._update_inverted_index_dict_with_key_set(
                    module_names, ast_node, self._module_variable_usage
                )

    def _visit_variable_node_and_value_node(self, variable_node, value_node, context):

        if isinstance(variable_node, (ast.Name, ast.Attribute)):
            self._assign_variable(variable_node, value_node, context)
        elif isinstance(variable_node, ast.Tuple):
            # two tuples
            if isinstance(value_node, ast.Tuple):
                if len(variable_node.elts) == len(value_node.elts):
                    for variable_node_next, value_node_next in zip(
                        variable_node.elts, value_node.elts
                    ):
                        self._visit_variable_node_and_value_node(
                            variable_node_next, value_node_next, context
                        )
            else:
                # flow data to all possible tuple elements
                for element in variable_node.elts:
                    self._visit_variable_node_and_value_node(
                        element, value_node, context
                    )
        else:
            # Ignore other situations now
            # eg: a[0] = b or a[0 : 10] = c, it is very difficult to track variable in
            # collection or slices
            pass

    def _assign_variable(self, variable_node, value_node, context):

        # check if node is class variable based on variable name
        variable_node_name, is_class_variable = self._get_variable_node_name(
            variable_node, context
        )
        target_variable = self._get_variable_from_node(value_node, context)

        # update variable name now
        target_variable.name = variable_node_name

        # parse variable node name succeeded
        if variable_node_name is not None:
            # a.b.c.d
            variable_node_name_list = variable_node_name.split(".")
            # default variable map
            current_variable_map = context.variable_map
            # it is a class variable
            if is_class_variable and self._is_in_class_method(context):
                current_variable_map = context.parent_context.variable_map
            # it is a global variable, stored in global_map
            elif isinstance(context.root_node, ast.Module):
                current_variable_map = self._global_map
            # check all names
            for index, name in enumerate(variable_node_name_list):
                # last variable
                if index == len(variable_node_name_list) - 1:
                    # it is in collect mode, and it is not the first this variable occurs
                    if (
                        context.context_mode == ast_types.AstContext.COLLECT_MODE
                        and name in current_variable_map
                    ):
                        current_node = current_variable_map[name]
                        # it is a function assignation
                        if isinstance(current_node, ast_types.AstFunction):
                            current_node.return_value = target_variable
                        # it is a variable assignation, some extra works included here
                        elif isinstance(current_node, ast_types.AstVariable):
                            current_node.variable_value = target_variable.variable_value
                            current_node.variable_value_node = (
                                target_variable.variable_value_node
                            )
                            temp_variable_type_set = (
                                current_node.variable_type_set
                                - set(ast_types.AstVariable.SPECIAL_TYPES)
                            )
                            current_node.variable_type_set = (
                                temp_variable_type_set
                                | target_variable.variable_type_set
                            )
                    else:
                        current_variable_map[name] = target_variable
                    break
                # name in call chain
                else:
                    if name in current_variable_map:
                        current_variable_map = self._get_variable_namespace(
                            current_variable_map[name]
                        )
                        if not current_variable_map:
                            break
                    else:
                        break

        # In assignation, collect all variable names in right-value tree and left-value tree
        self._gather_variable_names_in_ast_tree(variable_node, context)
        self._gather_variable_names_in_ast_tree(value_node, context)

    def _get_variable_from_node(self, node, context):  # noqa: C901

        # special check for primitive data type, eg: `str` and `int`
        if isinstance(node, ast.Str):
            return ast_types.AstVariable(
                node, {ast_types.AstVariable.STRING_TYPE}, node.s
            )

        if isinstance(node, ast.Num):
            return ast_types.AstVariable(
                node, {ast_types.AstVariable.NUMBER_TYPE}, node.n
            )
        # special check for string concatenation
        # eg: `str1 + str2`
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
            left_variable = self._get_variable_from_node(node.left, context)
            right_variable = self._get_variable_from_node(node.right, context)
            if ast_types.AstVariable.is_string(
                left_variable
            ) and ast_types.AstVariable.is_string(right_variable):
                string_result = (
                    left_variable.variable_value + right_variable.variable_value
                )
                return ast_types.AstVariable(
                    node, {ast_types.AstVariable.STRING_TYPE}, string_result
                )

        # tackle lambda expression in a simplified solution
        if isinstance(node, ast.Lambda):
            lambda_context = context.copy()
            # add default variables to lambda context
            for arg, default_arg in list(
                filter(
                    lambda result: isinstance(result[0], ast.arg),
                    zip(reversed(node.args.args), reversed(node.args.defaults)),
                )
            ):
                lambda_context.variable_map[arg.arg] = self._get_variable_from_node(
                    default_arg, context
                )
            return_value = self._get_variable_from_node(node.body, lambda_context)
            return ast_types.AstVariable(
                node,
                {ast_types.AstVariable.FUNCTION_TYPE},
                ast_types.AstFunction(None, node, return_value),
            )

        # map common ast_node to last call node
        node_to_call_dict = {}
        current_node = node
        # collect all name and attribute nodes
        node_list, node_name_list = [], []

        while hasattr(node, "value") or hasattr(node, "func"):
            if isinstance(node, (ast.Attribute, ast.Name)):
                node_list.append(node)
                node_name_list.append(utilities.get_node_name_or_attr(node))
            # map current node to last function call node, key point
            if isinstance(node, ast.Call):
                node_to_call_dict[node.func] = node
            if hasattr(node, "value"):
                node = node.value
            else:
                node = node.func

        # we can tackle variable chain only starts with ast.Name
        if isinstance(node, ast.Name):
            node_list.append(node)
            node_name_list.append(utilities.get_node_name_or_attr((node)))
            node_list.reverse()
            node_name_list.reverse()
            # class call chain, self access usage
            if self._access_class_attribute_with_self(node_name_list, context):
                self_node = node_list[0]
                node_list = node_list[1:]
                node_name_list = node_name_list[1:]
                if node_list:
                    start_name = node_name_list[0]
                    current_ast_variable = None
                    could_start_parse = False
                    # class property
                    if start_name in context.parent_context.variable_map:
                        current_ast_variable = context.parent_context.variable_map[
                            start_name
                        ]
                        could_start_parse = True
                    # function call
                    elif (
                        context.parent_context.namespace in self._global_map
                        and isinstance(
                            self._global_map[context.parent_context.namespace],
                            ast_types.AstClass,
                        )
                        and start_name
                        in self._global_map[
                            context.parent_context.namespace
                        ].function_dict
                    ):
                        current_ast_variable = self._global_map[
                            context.parent_context.namespace
                        ].function_dict[start_name]
                        could_start_parse = True
                    # nested class function call
                    elif context.parent_context.parent_context is not None:
                        outer_context = context.parent_context.parent_context
                        if (
                            context.parent_context.root_node.name
                            in outer_context.variable_map
                        ):
                            class_obj = outer_context.variable_map[
                                context.parent_context.root_node.name
                            ]
                            if ast_types.AstVariable.is_class_instance(class_obj):
                                class_obj = class_obj.variable_value
                                if start_name in class_obj.class_context.variable_map:
                                    current_ast_variable = (
                                        class_obj.class_context.variable_map[start_name]
                                    )
                                    could_start_parse = True
                                elif start_name in class_obj.function_dict:
                                    current_ast_variable = class_obj.function_dict[
                                        start_name
                                    ]
                                    could_start_parse = True

                    # move forward if possible
                    current_ast_variable = self._propagate_ast_variable(
                        current_ast_variable, node_list[0], node_to_call_dict, context
                    )

                    if could_start_parse:
                        result_variable = self._parse_call_chain(
                            node_list[1:],
                            current_ast_variable,
                            node_list[0],
                            context,
                            node_to_call_dict,
                        )
                        if result_variable:
                            return result_variable
                else:
                    # self node only
                    if (
                        context.parent_context.namespace in self._global_map
                        and isinstance(
                            self._global_map[context.parent_context.namespace],
                            ast_types.AstClass,
                        )
                    ):
                        return ast_types.AstVariable(
                            self_node,
                            {ast_types.AstVariable.CLASS_TYPE},
                            self._global_map[context.parent_context.namespace],
                        )

                    if context.parent_context.parent_context is not None:
                        outer_context = context.parent_context.parent_context
                        if (
                            context.parent_context.root_node.name
                            in outer_context.variable_map
                        ):
                            class_obj = outer_context.variable_map[
                                context.parent_context.root_node.name
                            ]
                            if ast_types.AstVariable.is_class_instance(class_obj):
                                return ast_types.AstVariable(
                                    self_node,
                                    {ast_types.AstVariable.CLASS_TYPE},
                                    class_obj.variable_value,
                                )
            # other possible cases
            else:
                start_name = node_name_list[0]
                # current ast variable
                current_ast_variable = None
                could_start_parse = False
                # local namespace
                if start_name in context.variable_map:
                    current_ast_variable = context.variable_map[start_name]
                    could_start_parse = True
                # global namespace
                elif start_name in self._global_map:
                    current_ast_variable = self._global_map[start_name]
                    could_start_parse = True
                # builtin namespace
                elif start_name in self._builtin_map:
                    current_ast_variable = self._builtin_map[start_name]
                    could_start_parse = True

                # move forward if possible
                current_ast_variable = self._propagate_ast_variable(
                    current_ast_variable, node_list[0], node_to_call_dict, context
                )

                if could_start_parse:
                    variable_result = self._parse_call_chain(
                        node_list[1:],
                        current_ast_variable,
                        node_list[0],
                        context,
                        node_to_call_dict,
                    )
                    if variable_result:
                        return variable_result

        # Special check for call node. In most cases, function arguments are irrelevant
        if isinstance(current_node, ast.Call):
            modules = self._get_modules_used_in_ast_name_and_attribute_chain(
                current_node, context
            )
        else:
            # Finally, regard it as a modules set, since we have no idea how to parse this object
            modules = self._get_modules_used_in_ast_tree(current_node, context)

        # remove class type, since it could not be a class variable
        modules -= set(ast_types.AstVariable.SPECIAL_TYPES)
        # try to find a variable name for this unknown variable
        variable_name = (
            utilities.get_node_name_or_attr(current_node)
            if isinstance(current_node, (ast.Name, ast.Attribute))
            else None
        )

        return ast_types.AstVariable(current_node, modules, None, variable_name)

    def _parse_call_chain(  # noqa: C901
        self, node_list, current_ast_variable, current_node, context, node_to_call_dict
    ):
        """
        parse a call chain between objects and classes
        """
        parse_succeed = True
        for node in node_list:
            current_node_name = utilities.get_node_name_or_attr(node)
            current_node = node
            # AstClass, initialize a new class variable
            if isinstance(current_ast_variable, ast_types.AstClass):
                # local variable
                if current_node_name in current_ast_variable.class_context.variable_map:
                    current_ast_variable = (
                        current_ast_variable.class_context.variable_map[
                            current_node_name
                        ]
                    )
                # function call
                elif current_node_name in current_ast_variable.function_dict:
                    current_ast_variable = current_ast_variable.function_dict[
                        current_node_name
                    ]
                else:
                    parse_succeed = False
                    break
            # class variable
            elif ast_types.AstVariable.is_class_instance(current_ast_variable):
                # class context first
                ast_class = current_ast_variable.variable_value
                # local variable
                if current_node_name in ast_class.class_context.variable_map:
                    current_ast_variable = ast_class.class_context.variable_map[
                        current_node_name
                    ]
                # function call
                elif current_node_name in ast_class.function_dict:
                    current_ast_variable = ast_class.function_dict[current_node_name]
                else:
                    parse_succeed = False
                    break
            # module
            elif isinstance(current_ast_variable, ast_types.AstModule):
                if current_node_name in current_ast_variable.global_map:
                    current_ast_variable = current_ast_variable.global_map[
                        current_node_name
                    ]
                else:
                    parse_succeed = False
                    break
            # module variable
            elif ast_types.AstVariable.is_module(current_ast_variable):
                if current_node_name in current_ast_variable.variable_value.global_map:
                    current_ast_variable = (
                        current_ast_variable.variable_value.global_map[
                            current_node_name
                        ]
                    )
                else:
                    parse_succeed = False
                    break
            else:
                parse_succeed = False
                break

            current_ast_variable = self._propagate_ast_variable(
                current_ast_variable, node, node_to_call_dict, context
            )

        # if we parse all nodes succeeded
        if parse_succeed:
            last_call_node = (
                node_to_call_dict[current_node]
                if current_node in node_to_call_dict
                else current_node
            )
            # special check for AstClass, instantiate a new namespace
            if isinstance(
                current_ast_variable, ast_types.AstClass
            ) or ast_types.AstVariable.is_class_instance(current_ast_variable):
                if ast_types.AstVariable.is_class_instance(current_ast_variable):
                    current_ast_variable = current_ast_variable.variable_value
                # initialize a new class variable, since it is a function call
                if node_to_call_dict.get(current_node, None) is not None:
                    ast_class = current_ast_variable.copy()
                else:
                    # don't need to copy here, since it is a alias of current class
                    ast_class = current_ast_variable
                ast_class.class_context.context_mode = (
                    ast_types.AstContext.SIMULATE_MODE
                )
                variable_type_set = {ast_types.AstVariable.CLASS_TYPE}
                variable_type_set |= ast_class.modules
                # use call node as variable_value_node
                return ast_types.AstVariable(
                    last_call_node, variable_type_set, ast_class
                )

            # wrap special types into ast_variable
            if isinstance(current_ast_variable, ast_types.AstFunction):
                return ast_types.AstVariable(
                    last_call_node,
                    {ast_types.AstVariable.FUNCTION_TYPE},
                    current_ast_variable,
                )
            if isinstance(current_ast_variable, ast_types.AstModule):
                return ast_types.AstVariable(
                    last_call_node,
                    {ast_types.AstVariable.MODULE_TYPE},
                    current_ast_variable,
                )
            if isinstance(current_ast_variable, ast_types.AstBuiltinFunction):
                return ast_types.AstVariable(
                    last_call_node,
                    {ast_types.AstVariable.BUILTIN_TYPE},
                    current_ast_variable,
                )
            if isinstance(current_ast_variable, ast_types.AstCallableFunction):
                return ast_types.AstVariable(
                    last_call_node,
                    {ast_types.AstVariable.CALLABLE_FUNCTION},
                    current_ast_variable,
                )

            # now it could only be ast_variable
            return current_ast_variable

        return None

    def _gather_variable_names_in_ast_tree(self, root_node, context):

        for ast_node in self.walk(root_node):
            # eg: a.func(), a.func is not acceptable
            # a.func(x, y), x and y should be acceptable
            if (
                not isinstance(self._parent_ast_node_dict.get(ast_node, None), ast.Call)
            ) or self._parent_ast_node_dict[ast_node].func != ast_node:
                variable_name = utilities.get_name_from_attribute_chain(ast_node)
                if variable_name:
                    self._update_inverted_index_dict(
                        variable_name, ast_node, self._variable_usage
                    )
                    variable = self._get_variable_from_node(ast_node, context)
                    self._ast_node_to_variable[ast_node] = variable

    def _get_variable_node_name(self, node, context):
        # Here we only care about `a.b.c`, some usage like a.func().b, the left value won't be used in the future, so
        # just leave out these cases. For Function call used in a.func().b, it will be covered by visit_call_node

        # @Return node_name, is_class_attribute
        name_list = utilities.get_name_list_from_attribute_chain(node)
        if name_list:
            # self.a
            if self._access_class_attribute_with_self(name_list, context):
                # skip self
                return ".".join(name_list[1:]), True
            if self._is_in_class(context):
                return ".".join(name_list), True

            return ".".join(name_list), False

        return None, False

    def _get_modules_used_in_ast_name_and_attribute_chain(  # noqa: C901
        self, node, context
    ):
        """
        core helper function, used to extract module name from ast.Name or ast.Attribute node
        eg: `a.b.c`, `a`, `func().a`, `func().a.b`.
        And at the same time simulate function call
        """
        # gather all modules being used in this call chain, need to simulate function running here

        node_name_list = []
        node_list = []
        node_to_call_dict = {}

        while hasattr(node, "value") or hasattr(node, "func"):
            if isinstance(node, (ast.Name, ast.Attribute)):
                node_name_list.append(utilities.get_node_name_or_attr(node))
                node_list.append(node)
            if isinstance(node, ast.Call):
                node_to_call_dict[node.func] = node
            if hasattr(node, "value"):
                node = node.value
            else:
                node = node.func

        if isinstance(node, ast.Name):
            node_name_list.append(node.id)
            node_list.append(node)

            node_name_list.reverse()
            node_list.reverse()

            result_set = set()
            # current ast node
            current_ast_variable = None
            could_start_parse = False
            # parse from which index
            parse_start_index = 0

            # self class attribute
            if self._access_class_attribute_with_self(node_name_list, context):
                # class variable
                node_name_list = node_name_list[1:]
                node_list = node_list[1:]
                if node_list:
                    start_name = node_name_list[0]
                    # check if it is a variable reference
                    if start_name in context.parent_context.variable_map:
                        current_ast_variable = context.parent_context.variable_map[
                            start_name
                        ]
                        could_start_parse = True
                        parse_start_index = 1
                    # check if it is a class function call
                    elif (
                        (context.parent_context.namespace in self._global_map)
                        and isinstance(
                            self._global_map[context.parent_context.namespace],
                            ast_types.AstClass,
                        )
                        and start_name
                        in self._global_map[
                            context.parent_context.namespace
                        ].function_dict
                    ):
                        current_ast_variable = self._global_map[
                            context.parent_context.namespace
                        ].function_dict[start_name]
                        could_start_parse = True
                        parse_start_index = 1
                    # check if it is a nested class function call
                    elif context.parent_context.parent_context is not None:
                        outer_context = context.parent_context.parent_context
                        if (
                            context.parent_context.root_node.name
                            in outer_context.variable_map
                        ):
                            class_obj = outer_context.variable_map[
                                context.parent_context.root_node.name
                            ]
                            if ast_types.AstVariable.is_class_instance(class_obj):
                                class_obj = class_obj.variable_value
                                if start_name in class_obj.class_context.variable_map:
                                    current_ast_variable = (
                                        class_obj.class_context.variable_map[start_name]
                                    )
                                    could_start_parse = True
                                    parse_start_index = 1
                                elif start_name in class_obj.function_dict:
                                    current_ast_variable = class_obj.function_dict[
                                        start_name
                                    ]
                                    could_start_parse = True
                                    parse_start_index = 1
                    current_ast_variable = self._propagate_ast_variable(
                        current_ast_variable, node_list[0], node_to_call_dict, context
                    )

                if not could_start_parse:
                    # self node only
                    if (
                        context.parent_context.namespace in self._global_map
                        and isinstance(
                            self._global_map[context.parent_context.namespace],
                            ast_types.AstClass,
                        )
                    ):
                        result_set |= self._global_map[
                            context.parent_context.namespace
                        ].modules
                        could_start_parse = True
                        parse_start_index = 0
                    else:
                        if context.parent_context.parent_context is not None:
                            outer_context = context.parent_context.parent_context
                            if (
                                context.parent_context.root_node.name
                                in outer_context.variable_map
                            ):
                                class_obj = outer_context.variable_map[
                                    context.parent_context.root_node.name
                                ]
                                if ast_types.AstVariable.is_class_instance(class_obj):
                                    result_set |= class_obj.variable_value.modules
                                    could_start_parse = True
                                    parse_start_index = 0
            else:
                start_name = node_name_list[0]
                if start_name in context.variable_map:
                    current_ast_variable = context.variable_map[start_name]
                    could_start_parse = True
                    parse_start_index = 1
                # global function
                elif start_name in self._global_map:
                    current_ast_variable = self._global_map[start_name]
                    could_start_parse = True
                    parse_start_index = 1
                # builtin functions
                elif start_name in self._builtin_map:
                    current_ast_variable = self._builtin_map[start_name]
                    could_start_parse = True
                    parse_start_index = 1
                current_ast_variable = self._propagate_ast_variable(
                    current_ast_variable, node_list[0], node_to_call_dict, context
                )

            # parse from left to right
            if could_start_parse:
                # cache start_index for further usage
                i = parse_start_index
                # concatenate module prefix together
                # skip first node name
                for i in range(parse_start_index, len(node_name_list)):
                    node_name = node_name_list[i]
                    # class definition
                    if isinstance(current_ast_variable, ast_types.AstClass):
                        if node_name in current_ast_variable.class_context.variable_map:
                            current_ast_variable = (
                                current_ast_variable.class_context.variable_map[
                                    node_name
                                ]
                            )
                        elif node_name in current_ast_variable.function_dict:
                            current_ast_variable = current_ast_variable.function_dict[
                                node_name
                            ]
                        else:
                            break
                    # class instance variable
                    elif ast_types.AstVariable.is_class_instance(current_ast_variable):
                        if (
                            node_name
                            in current_ast_variable.variable_value.class_context.variable_map
                        ):
                            current_ast_variable = current_ast_variable.variable_value.class_context.variable_map[
                                node_name
                            ]
                        elif (
                            node_name
                            in current_ast_variable.variable_value.function_dict
                        ):
                            current_ast_variable = (
                                current_ast_variable.variable_value.function_dict[
                                    node_name
                                ]
                            )
                        else:
                            break
                    # module definition
                    elif isinstance(current_ast_variable, ast_types.AstModule):
                        if node_name in current_ast_variable.global_map:
                            current_ast_variable = current_ast_variable.global_map[
                                node_name
                            ]
                        else:
                            break
                    # module variable
                    elif ast_types.AstVariable.is_module(current_ast_variable):
                        module = current_ast_variable.variable_value
                        if node_name in module.global_map:
                            current_ast_variable = module.global_map[node_name]
                        else:
                            break
                    else:
                        break

                    current_ast_variable = self._propagate_ast_variable(
                        current_ast_variable, node_list[i], node_to_call_dict, context
                    )
                else:
                    # move one step forward if break is not exists
                    i += 1

                candidate_prefixes = result_set.copy()
                # collect variable types
                if isinstance(current_ast_variable, ast_types.AstVariable):
                    result_set |= current_ast_variable.variable_type_set
                    candidate_prefixes |= current_ast_variable.variable_type_set
                    current_ast_variable = current_ast_variable.variable_value

                # for class and module, some special collection
                if isinstance(current_ast_variable, ast_types.AstClass):
                    result_set |= current_ast_variable.modules
                    candidate_prefixes |= current_ast_variable.modules
                elif isinstance(current_ast_variable, ast_types.AstBuiltinFunction):
                    # `builtin type` and `builtin.func_name`
                    result_set |= {
                        ast_types.AstVariable.BUILTIN_TYPE,
                        ast_types.AstVariable.BUILTIN_TYPE
                        + "."
                        + current_ast_variable.name,
                    }
                    candidate_prefixes |= {
                        ast_types.AstVariable.BUILTIN_TYPE,
                        ast_types.AstVariable.BUILTIN_TYPE
                        + "."
                        + current_ast_variable.name,
                    }

                # namespace means current ast variable is imported from metadata_store
                if getattr(current_ast_variable, "namespace", None):
                    names = current_ast_variable.namespace.split(".")
                    candidate_prefixes.add(current_ast_variable.namespace)
                    for j in range(len(names)):
                        module_string = ".".join(names[: j + 1])
                        result_set.add(module_string)

                # builtin is a exception(used by python check), so retain this type
                candidate_prefixes -= set(ast_types.AstVariable.SPECIAL_TYPES) - {
                    ast_types.AstVariable.BUILTIN_TYPE
                }

                # collect all attributes and names until call node was found
                for variable_type_prefix in candidate_prefixes:
                    possible_module_list = [variable_type_prefix]
                    start_index = i
                    while start_index < len(node_name_list):
                        possible_module_list.append(node_name_list[start_index])
                        result_set.add(".".join(possible_module_list))
                        # use call node to interrupt
                        if node_list[start_index] in node_to_call_dict:
                            break
                        start_index += 1

            return result_set

        return set()

    def _get_modules_used_in_ast_tree(self, tree_node, context):

        result_set = set()
        stack = deque([tree_node])
        while stack:
            node = stack.pop()
            module_names = self._get_modules_used_in_ast_name_and_attribute_chain(
                node, context
            )
            result_set |= set(module_names)
            stack.extend(
                list(
                    reversed([child_node for child_node in self.iter_child_nodes(node)])
                )
            )
        return result_set

    def _check_function_args(self, node, function_args, function_keywords):

        # check function args
        if function_args is not None:
            for index, arg_dict in iter(function_args.items()):
                # index is illegal
                if index < 0 or index >= len(node.args):
                    # if it is required
                    if arg_dict.get("required", False):
                        return False
                else:
                    if not self._contains_same_ast_tree_in_node_set(
                        node.args[index],
                        self._get_expr_ast_node_set(arg_dict.get("arg_values", [])),
                    ):
                        return False

        # check function keywords
        if function_keywords is not None:
            keyword_arg_dict = {}
            for keyword in node.keywords:
                keyword_arg_dict[keyword.arg] = keyword.value

            for keyword_name, keyword_value_dict in iter(function_keywords.items()):
                if keyword_name in keyword_arg_dict:
                    if not self._contains_same_ast_tree_in_node_set(
                        keyword_arg_dict[keyword_name],
                        self._get_expr_ast_node_set(
                            keyword_value_dict.get("arg_values", [])
                        ),
                    ):
                        return False
                else:
                    if keyword_value_dict.get("required", False):
                        return False

        return True

    def _contains_same_ast_tree_in_node_set(self, node1, node_set):

        for node in node_set:
            if utilities.is_same_ast_tree(node1, node, node1_extra=False):
                return True
        return False

    def _get_expr_ast_node_set(self, ast_strings):

        node_set = set()
        for ast_string in ast_strings:
            node = self._get_expr_ast_node(ast_string)
            if node is not None:
                node_set.add(node)
        return node_set

    def _get_expr_ast_node(self, ast_string):

        try:
            ast_tree = ast.parse(ast_string)
            # find first Expr node, then return its value
            for node in ast.walk(ast_tree):
                if isinstance(node, ast.Expr):
                    return node.value
        except BaseException:
            pass
        return None

    def _is_prefix_module(self, prefix_module, module):

        prefix_string_array = prefix_module.split(".")
        module_string_array = module.split(".")
        i = 0
        while (
            i < len(prefix_string_array)
            and i < len(module_string_array)
            and (prefix_string_array[i] == module_string_array[i])
        ):
            i += 1
        return i == len(prefix_string_array)

    def _get_parent_chain_length(self, node):
        ans = 0
        while node is not None:
            node = self._parent_ast_node_dict.get(node, None)
            ans += 1
        return ans

    def _collect_sensitive_string_usage(self, node, context):
        # collect sensitive literal string usage
        variable = self._get_variable_from_node(node, context)
        if ast_types.AstVariable.is_string(variable):
            string = variable.variable_value
            # it is a module name
            if string in self._module_imported_usage:
                self._update_inverted_index_dict(
                    string, node, self._module_variable_usage
                )

    def _collect_literal_string_usage(self, node, context):

        variable = self._get_variable_from_node(node, context)
        if ast_types.AstVariable.is_string(variable):
            string = variable.variable_value
            self._update_inverted_index_dict(string, node, self._literal_string_usage)

    def _filter_result_list(self, result_list, lineno_only, with_context):
        # sort result based on node.lineno first
        result_list.sort(key=lambda node: node.lineno)
        # lineno_only
        if lineno_only:
            result_list = sorted(list(set(map(lambda node: node.lineno, result_list))))
            return result_list
        # with_context
        if with_context:
            result_list = list(
                map(
                    lambda node: {
                        "ast_node": node,
                        "local_context": self._context_dict.get(node, None),
                        "global_context": self._global_context_dict.get(node, None),
                    },
                    result_list,
                )
            )
            return result_list
        # by default, we just return all ast nodes sorted in line number order
        return result_list

    def _global_map_snapshot(self):
        new_dict = {}
        for key, value in iter(self._global_map.items()):
            # shallow copy here, since we only care about the key-value pair, if we don't modify value
            new_dict[key] = value
        return new_dict

    def _local_context_snapshot(self, context):
        new_context = ast_types.AstContext(
            context.level, context.root_node, context.parent_context
        )
        # shallow copy variable_map, reduce copy time
        for variable_name, ast_variable in iter(context.variable_map.items()):
            # here we don't call variable's copy function, since it is a readonly data structure
            new_context.variable_map[variable_name] = ast_variable
        # copy namespace
        new_context.namespace = context.namespace
        # copy context mode
        new_context.context_mode = context.context_mode
        return new_context

    def _access_class_attribute_with_self(self, name_list, context):

        if name_list:
            return name_list[0] == "self" and self._is_in_class_method(context)

        return False

    def _is_in_class(self, context):

        return isinstance(context.root_node, ast.ClassDef)

    def _is_in_class_method(self, context):

        # current is function, parent is class
        return (
            context.parent_context is not None
            and isinstance(context.parent_context.root_node, ast.ClassDef)
            and isinstance(context.root_node, ast.FunctionDef)
        )

    def _is_in_global_context(self, context):

        return isinstance(context.root_node, ast.Module)

    def _get_variable_namespace(self, ast_variable):
        """
        get variable namespace for current ast node
        """
        if isinstance(ast_variable, ast_types.AstModule):
            return ast_variable.global_map
        if isinstance(ast_variable, ast_types.AstClass):
            return ast_variable.class_context.variable_map
        if ast_types.AstVariable.is_module(ast_variable):
            return ast_variable.variable_value.global_map
        if ast_types.AstVariable.is_class_instance(ast_variable):
            return ast_variable.variable_value.class_context.variable_map

        return None

    def _store_attribute_in_current_context(
        self, attribute_name, attribute, ast_node, context
    ):

        # global namespace
        if self._is_in_global_context(context):
            attribute.name = attribute_name
            self._global_map[attribute_name] = attribute
        else:
            # local namespace
            if isinstance(attribute, ast_types.AstClass):
                context.variable_map[attribute_name] = ast_types.AstVariable(
                    ast_node,
                    {ast_types.AstVariable.CLASS_TYPE},
                    attribute,
                    name=attribute_name,
                )
            elif isinstance(attribute, ast_types.AstFunction):
                context.variable_map[attribute_name] = ast_types.AstVariable(
                    ast_node,
                    {ast_types.AstVariable.FUNCTION_TYPE},
                    attribute,
                    name=attribute_name,
                )
            elif isinstance(attribute, ast_types.AstModule):
                context.variable_map[attribute_name] = ast_types.AstVariable(
                    ast_node,
                    {ast_types.AstVariable.MODULE_TYPE},
                    attribute,
                    name=attribute_name,
                )
            elif isinstance(attribute, ast_types.AstCallableFunction):
                context.variable_map[attribute_name] = ast_types.AstVariable(
                    ast_node,
                    {ast_types.AstVariable.CALLABLE_FUNCTION},
                    attribute,
                    name=attribute_name,
                )
            else:
                # it could be AstVariable only
                attribute.name = attribute_name
                context.variable_map[attribute_name] = attribute
                assert isinstance(attribute, ast_types.AstVariable)

    def _collect_module_usage_in_external_module(self, module, ast_node):

        if ast_types.AstVariable.is_module(module):
            module = module.variable_value
        if isinstance(module, ast_types.AstModule):
            name = module.namespace if module.namespace else module.name
            names = name.split(".")
            for i in range(len(names)):
                name_prefix = ".".join(names[: i + 1])
                self._update_inverted_index_dict(
                    name_prefix, ast_node, self._module_imported_usage
                )

    def _update_inverted_index_dict(self, key, node, inverted_index_dict):
        """
        update inverted index dict
        """
        assert isinstance(inverted_index_dict, dict)
        assert isinstance(node, ast.AST)
        assert isinstance(key, str)

        if key not in inverted_index_dict:
            inverted_index_dict[key] = set()
        inverted_index_dict[key].add(node)

    def _update_inverted_index_dict_with_key_set(
        self, key_set, node, inverted_index_dict
    ):

        for key in key_set:
            self._update_inverted_index_dict(key, node, inverted_index_dict)

    def gather_metadata(self, root_node):
        """
        Gather node's metadata via RPO traverse
        """
        types_set = {}

        def _recur(root_node):
            if root_node and root_node._fields:
                self._children_ast_node_dict[root_node] = []

            self._subtree_types_dict[root_node] = {type(root_node)}
            for ch_node in ast.iter_child_nodes(root_node):
                self._parent_ast_node_dict[ch_node] = root_node
                self._children_ast_node_dict[root_node].append(ch_node)
                _recur(ch_node)

                ch_subtypes = (
                    {type(ch_node)}
                    if ch_node not in self._subtree_types_dict
                    else self._subtree_types_dict[ch_node]
                )

                ch_s = self._subtree_types_dict[root_node] | ch_subtypes
                k = tuple(ch_s)
                if k not in types_set:
                    types_set[k] = ch_s

                self._subtree_types_dict[root_node] = types_set[k]

        _recur(root_node)

    def iter_child_nodes(self, root_node):
        if root_node in self._children_ast_node_dict:
            for ch_node in self._children_ast_node_dict[root_node]:
                yield ch_node
        elif root_node._fields:

            for ch_node in ast.iter_child_nodes(root_node):
                yield ch_node

    def walk(self, root_node):
        q = deque([root_node])
        while q:
            n = q.popleft()
            q.extend(self.iter_child_nodes(n))
            yield n

    def _propagate_ast_variable(
        self, current_ast_variable, ast_node, node_to_call_dict, context
    ):

        while self._is_propagate_variable(current_ast_variable):
            # propagate AstVariable
            if isinstance(current_ast_variable, ast_types.AstVariable):
                current_ast_variable = current_ast_variable.variable_value
            if isinstance(current_ast_variable, ast_types.AstFunction):
                if ast_node in node_to_call_dict:
                    current_ast_variable = current_ast_variable.action()
                    ast_node = node_to_call_dict[ast_node]
                else:
                    break
            elif isinstance(
                current_ast_variable,
                (ast_types.AstBuiltinFunction, ast_types.AstCallableFunction),
            ):
                if ast_node in node_to_call_dict:
                    current_ast_variable = self._simulate_function_call(
                        current_ast_variable, node_to_call_dict[ast_node], context
                    )
                    ast_node = node_to_call_dict[ast_node]
                else:
                    break

        return current_ast_variable

    def _is_propagate_variable(self, current_ast_variable):

        # function object or function object variable
        return (
            isinstance(
                current_ast_variable,
                (
                    ast_types.AstBuiltinFunction,
                    ast_types.AstCallableFunction,
                    ast_types.AstFunction,
                ),
            )
            or ast_types.AstVariable.is_function(current_ast_variable)
            or ast_types.AstVariable.is_callable(current_ast_variable)
        )

    def _simulate_function_call(self, current_ast_variable, call_node, context):

        # parse variable value
        if isinstance(current_ast_variable, ast_types.AstVariable):
            current_ast_variable = current_ast_variable.variable_value

        if isinstance(
            current_ast_variable,
            (ast_types.AstBuiltinFunction, ast_types.AstCallableFunction),
        ):
            return current_ast_variable.action(
                call_node,
                self,
                [self._get_variable_from_node(arg, context) for arg in call_node.args],
                {
                    keyword.arg: self._get_variable_from_node(keyword.value, context)
                    for keyword in call_node.keywords
                },
                context,
            )

        raise Exception("Illegal AST variable `{var}` to call".format(var=type(current_ast_variable)))
