import sys
import weakref

from concurrent.futures import Future


class CircularFuturesChainException(Exception):
    pass


class ThenableFuture(Future):

    @property
    def _chained_futures_log(self):
        prop_name = '_chained_futured_log_list'
        log = getattr(self, prop_name, None)
        if log is None:
            log = weakref.WeakSet()
            setattr(self, prop_name, log)
        return log

    def _chain_to_another_future(self, base_future):
        """
        Chains a Future instance directly to another Future instance

        Used for recursive Promise Resolution Procedure (section 2.3.2) specified in Promise/A+
        that allows .then() to piggy -back on a Promise returned by success handler

        :param Future base_future:
        """

        if base_future in self._chained_futures_log:
            raise CircularFuturesChainException(
                'Circular Futures chain detected. Future {} is already in the resolved chain {}'.format(
                    base_future, set(self._chained_futures_log)
                )
            )
        else:
            self._chained_futures_log.add(base_future)

        def _done_handler(base_future):
            """
            Converts results of underlying future into results of new future

            :param ThenableFuture base_future: Original Future instance, but now guaranteed to be resolved
                due to cancellation or completion.
            """
            if not base_future.done():
                # this should never ever be true.
                # having this code here just to avoid infinite timeout
                self.cancel()
                return

            if base_future.cancelled():
                self.cancel()
                return

            try:
                result = base_future.result()
                if isinstance(result, Future):
                    self._chain_to_another_future(result)
                else:
                    self.set_result(result)
                return
            except BaseException:
                # note, that exception may come from self.result()
                # and from on_fulfilled(result) calls.
                ex, trace_back = sys.exc_info()[1:]
                self.set_exception_info(ex, trace_back)
                return

        base_future.add_done_callback(_done_handler)

    def then(self, on_fulfilled=None, on_rejected=None):
        """
        JavaScript-like (https://promisesaplus.com/) .then() method allowing
        futures to be chained.

        In conformance with Promise/A+ spec, if on_fulfilled returns an instance
        of Future, this code will auto-chain returned Future instance to the
        resolution of the Future returned by on_fulfilled.

        Effectively, resolution of Future returned by this method may be infinitely
        pushed forward until recursive Futures are exhausted or an error is encountered.

        Note, that while Promise Resolution Procedure (auto-chaining to Future
        returned by success handler) described in section 2.3.2
        is supported when that Future is explicitly
        a subclass of Future that is the base class of this class, duck-type
        thenable detection and auto-chaining described in section 2.3.3 *IS NOT SUPPORTED*

        The goal of this extension of basic PEP 3148 Future API was to make meaningful
        thenable support. Promise/A+ Promise Resolution Procedure section 2.3.2
        is fundamental for auto-chaining. Section 2.3.3, though, is there largely
        for backward-compatibility of previous JavaScript thenable variants,
        which we don't have in Python.

        :param on_fulfilled: (optional)
            Function to be called when this Future is successfully resolved
            Once this Future is resolved, it's result value is the input for
            on_fulfilled function.
            If on_fulfilled is None, new Future (one returned by this method) will be
            resolved directly by the result of the underlying Future
        :type on_fulfilled: None or function
        :param on_rejected: (optional)
            Function to be called when this Future is rejected. Exception instance
            picked up from rejected Future is the input value for on_rejected
            If on_rejected is None, new Future (one returned by this method) will be
            rejected directly with the exception result of the underlying Future
        :type on_rejected: None or function
        :return: A new instance of Future to be resolved once
            present Future is resolved and either on_fulfilled or on_rejected
            completes.
            New Future's result value will be that of on_fulfilled.
        :rtype: ThenableFuture
        """

        new_future = self.__class__()

        def _done_handler(base_future):
            """
            Converts results of underlying future into results of new future

            :param ThenableFuture base_future: Original Future instance, but now guaranteed to be resolved
                due to cancellation or completion.
            """
            if not base_future.done():
                # this should never ever be true.
                # having this code here just to avoid infinite timeout
                new_future.cancel()
                return

            if base_future.cancelled():
                new_future.cancel()
                return

            try:
                result = base_future.result()
                if on_fulfilled:
                    result = on_fulfilled(result)

                # Per Promise/A+ spec, if return value is a Promise,
                # our promise must adapt the state of the return value Promise
                if isinstance(result, Future):
                    # this is the only outcome where we don't
                    # set new_future's result in this code and
                    # defer resolution of new_future to outcome of return value Promise resolution
                    new_future._chain_to_another_future(result)
                else:
                    new_future.set_result(result)
                    return
            except BaseException:
                # note, that exception may come from self.result()
                # and from on_fulfilled(result) calls.
                ex, trace_back = sys.exc_info()[1:]
                if not on_rejected:
                    new_future.set_exception_info(ex, trace_back)
                    return
                else:
                    try:
                        result = on_rejected(ex)
                        if isinstance(result, BaseException):
                            raise result
                        else:
                            new_future.set_result(result)
                        return
                    except BaseException:
                        ex, trace_back = sys.exc_info()[1:]
                        new_future.set_exception_info(ex, trace_back)
                        return

        self.add_done_callback(_done_handler)

        return new_future
