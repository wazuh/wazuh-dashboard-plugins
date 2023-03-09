import ast
from collections import deque


class AstInfoQuery(object):
    def __init__(self, root_ast_node, parent_ast_node_dict, subtree_types_dict):
        assert root_ast_node is not None
        self._queue = deque()
        self._queue.append(root_ast_node)
        self._root_ast_node = root_ast_node
        self._is_end = False

        self._parent_ast_node_dict = parent_ast_node_dict
        self._subtree_types_dict = subtree_types_dict

    def call_nodes(self, filter_function=None, force_propagate=True):
        self.propagate_nodes(ast.Call, filter_function, force_propagate)
        return self

    def name_nodes(self, filter_function=None, force_propagate=True):
        self.propagate_nodes(ast.Name, filter_function, force_propagate)
        return self

    def attribute_nodes(self, filter_function=None, force_propagate=True):
        self.propagate_nodes(ast.Attribute, filter_function, force_propagate)
        return self

    def function_nodes(self, filter_function=None, force_propagate=True):
        self.propagate_nodes(ast.FunctionDef, filter_function, force_propagate)
        return self

    def class_nodes(self, filter_function=None, force_propagate=True):
        self.propagate_nodes(ast.ClassDef, filter_function, force_propagate)
        return self

    def propagate_nodes(
        self, ast_type=ast.AST, filter_function=None, force_propagate=True
    ):
        """
        propagate all nodes with given strategies, if current operation has no effect,
        is_end would be True, otherwise False
        :param ast_type:                target ast node type, ast.AST as default
        :param filter_function:         filter_function used to filter specific nodes
        :param force_propagate:         if it is true, it means we will always discard nodes in current batch
        """
        assert issubclass(ast_type, ast.AST)
        if force_propagate:
            self._force_propagate(ast_type, filter_function)
        else:
            self._propagate_when_possible(ast_type, filter_function)
        return self

    def is_end(self):
        """
        If is_end is true, it means last operation has no effect, otherwise last
        operation is performed successfully
        """
        return self._is_end

    def _propagate_when_possible(self, ast_type, filter_function):
        result_queue = deque()
        next_queue = deque()
        self._is_end = True
        while self._queue:
            current_node = self._queue.popleft()
            # it current_node could still be propagated, skip it
            if self._contain_target_type_nodes(current_node, ast_type):
                for child_node in ast.iter_child_nodes(current_node):
                    next_queue.append(child_node)
                self._is_end = False
            else:
                result_queue.append(current_node)
        while next_queue:
            current_node = next_queue.popleft()
            if isinstance(current_node, ast_type) and (
                filter_function is None or filter_function(current_node)
            ):
                result_queue.append(current_node)
            else:
                for child_node in ast.iter_child_nodes(current_node):
                    next_queue.append(child_node)
        self._queue = result_queue

    def _contain_target_type_nodes(self, root_node, ast_type):

        for child_node in ast.iter_child_nodes(root_node):
            if ast_type in self._subtree_types_dict[child_node]:
                return True
            # special check for ast.AST
            if ast_type == ast.AST:
                return True
        return False

    def _force_propagate(self, ast_type, filter_function):
        next_queue = deque()
        # propagate one layer first, always discard nodes in current queue
        while self._queue:
            current_node = self._queue.popleft()
            for child_node in ast.iter_child_nodes(current_node):
                next_queue.append(child_node)
        self._queue = next_queue

        next_queue = deque()
        while self._queue:
            current_node = self._queue.popleft()
            # terminal node
            if isinstance(current_node, ast_type) and (
                filter_function is None or filter_function(current_node)
            ):
                next_queue.append(current_node)
            else:
                for child_node in ast.iter_child_nodes(current_node):
                    self._queue.append(child_node)
        self._queue = next_queue

        # some nodes are available
        if not self._queue:
            self._is_end = True
        else:
            self._is_end = False

    def filter(self, filter_logic_node):
        assert isinstance(filter_logic_node, BaseNode)
        return self._bottom_top_filter_algorithm(filter_logic_node)

    def _bottom_top_filter_algorithm(self, filter_logic_node):
        all_node_set = set(self._queue)
        nodes = self._post_traverse(filter_logic_node, all_node_set)
        self._queue = deque(nodes)
        return self

    def _post_traverse(self, filter_logic_node, all_node_set):
        if isinstance(filter_logic_node, BinaryLogicNode):
            left_set = self._post_traverse(filter_logic_node.left, all_node_set)
            right_set = self._post_traverse(filter_logic_node.right, all_node_set)
            if isinstance(filter_logic_node, Or):
                return left_set | right_set
            if isinstance(filter_logic_node, And):
                return left_set & right_set

            raise Exception("Unknown BinaryLogicNode {}".format(type(filter_logic_node)))
        if isinstance(filter_logic_node, MultiLogicNode):
            if isinstance(filter_logic_node, (MultiOr, MultiAnd)):
                if filter_logic_node.nodes:
                    # base result set
                    result_set = self._post_traverse(
                        filter_logic_node.nodes[0], all_node_set
                    )
                    for node in filter_logic_node.nodes[1:]:
                        if isinstance(filter_logic_node, MultiAnd):
                            result_set = result_set & self._post_traverse(
                                node, all_node_set
                            )
                        elif isinstance(filter_logic_node, MultiOr):
                            result_set = result_set | self._post_traverse(
                                node, all_node_set
                            )
                    return result_set

                raise Exception(
                    "At least one element should be included in MultiLogicNode"
                )

            raise Exception("Unknown MultiBinaryLogicNode {}".format(type(filter_logic_node)))
        if isinstance(filter_logic_node, DataSetNode):
            if isinstance(filter_logic_node, Any):
                return self._get_next_batch_candidates_for_any(
                    all_node_set, filter_logic_node.node_set
                )
            if isinstance(filter_logic_node, All):
                return self._get_next_batch_candidates_for_all(
                    all_node_set, filter_logic_node.node_set
                )

            raise Exception("Unknown DataSetNode {}".format(type(filter_logic_node)))
        if isinstance(filter_logic_node, SingleLogicNode):
            if isinstance(filter_logic_node, Not):
                result_set = self._post_traverse(filter_logic_node.child, all_node_set)
                return all_node_set - result_set

            raise Exception("Unknown SingleLogicNode {}".format(type(filter_logic_node)))

        raise Exception("Unsupported Node {}".format(type(filter_logic_node)))

    def _get_next_batch_candidates_for_any(self, all_node_set, logic_node_set):
        result_set = set()
        queue = deque()
        for node in logic_node_set:
            queue.append(node)
        while queue:
            current_node = queue.popleft()
            if current_node in all_node_set:
                result_set.add(current_node)
            else:
                parent_node = self._parent_ast_node_dict.get(current_node, None)
                if parent_node:
                    queue.append(parent_node)
        return result_set

    def _get_next_batch_candidates_for_all(self, all_node_set, logic_node_set):
        result_set = set()
        visit_count = dict()
        queue = deque()
        for node in logic_node_set:
            queue.append(node)
        while queue:
            current_node = queue.popleft()
            if current_node in all_node_set:
                visit_count[current_node] = visit_count.get(current_node, 0) + 1
            else:
                parent_node = self._parent_ast_node_dict.get(current_node, None)
                if parent_node:
                    queue.append(parent_node)
        for node, cnt in iter(visit_count.items()):
            if cnt == len(logic_node_set):
                result_set.add(node)
        return result_set

    def collect(self):
        # use list here, want to keep the original order
        return list(self._queue)

    def persist(self):
        # persist current state, return a new query object
        new_query = AstInfoQuery(
            self._root_ast_node, self._parent_ast_node_dict, self._subtree_types_dict
        )  # pylint: disable=W0212
        new_query._queue.clear()  # pylint: disable=W0212
        new_query._is_end = self._is_end  # pylint: disable=W0212
        # copy node from current queue to new_query's queue
        for node in self._queue:  # pylint: disable=W0212
            new_query._queue.append(node)
        return new_query

    def reset(self):
        self._queue.clear()
        self._queue.append(self._root_ast_node)
        self._is_end = False


# All Tree nodes, including logic node and data node


class BaseNode(object):
    pass


class DataSetNode(BaseNode):
    def __init__(self, node_set):
        self._node_set = set(node_set)

    @property
    def node_set(self):
        return self._node_set


class SingleLogicNode(BaseNode):
    def __init__(self, child):
        self._child = child

    @property
    def child(self):
        return self._child


class Not(SingleLogicNode):
    pass


class BinaryLogicNode(BaseNode):
    def __init__(self, left, right):
        self._left = left
        self._right = right

    @property
    def left(self):
        return self._left

    @property
    def right(self):
        return self._right


class MultiLogicNode(BaseNode):
    def __init__(self, args):
        assert isinstance(args, list)
        self._nodes = args

    @property
    def nodes(self):
        return self._nodes


class Any(DataSetNode):
    pass


class All(DataSetNode):
    pass


class Or(BinaryLogicNode):
    pass


class And(BinaryLogicNode):
    pass


class MultiAnd(MultiLogicNode):
    def __init__(self, *args):
        super(MultiAnd, self).__init__(list(args))


class MultiOr(MultiLogicNode):
    def __init__(self, *args):
        super(MultiOr, self).__init__(list(args))
