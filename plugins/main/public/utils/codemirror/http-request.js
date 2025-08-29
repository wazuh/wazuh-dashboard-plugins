// Lightweight HTTP request mode for CodeMirror
// Inspired by CodeMirror modes, adapted for Wazuh API Console DSL
// Supports lines like:
//   # Comment
//   GET /agents?status=active
//   POST /agents\n{ ...json body... }

(function (mod) {
  if (typeof exports == 'object' && typeof module == 'object')
    // CommonJS
    mod(require('./lib/codemirror'));
  else if (typeof define == 'function' && define.amd)
    // AMD
    define(['./lib/codemirror'], mod);
  // Plain browser env
  else mod(CodeMirror);
})(function (CodeMirror) {
  'use strict';

  var METHODS = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/i;

  function startsRequestLine(stream) {
    var cur = stream.string.slice(stream.start);
    return /^\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/i.test(cur);
  }

  function startsJson(stream) {
    var cur = stream.string.slice(stream.start);
    return /^\s*(\{|\[)/.test(cur);
  }

  CodeMirror.defineMode('http-request', function (config) {
    var jsonMode = CodeMirror.getMode(config, {
      name: 'javascript',
      json: true,
    });

    return {
      startState: function () {
        return {
          inBody: false,
          expectBody: false,
          methodSeenOnLine: false,
          inQuery: false,
          queryExpect: 'param', // 'param' | 'value'
          jsonState: CodeMirror.startState(jsonMode),
        };
      },

      token: function (stream, state) {
        if (stream.sol()) {
          state.methodSeenOnLine = false;

          // If we were in body, but a new request line starts, exit body
          if (state.inBody && startsRequestLine(stream)) {
            state.inBody = false;
            state.expectBody = false;
            // reset JSON state for next time
            state.jsonState = CodeMirror.startState(jsonMode);
          }

          // If a body was expected and we see JSON starting, enter body
          if (
            !state.inBody &&
            state.expectBody &&
            (startsJson(stream) ||
              /^\s*"/.test(stream.string.slice(stream.start)))
          ) {
            state.inBody = true;
            state.expectBody = false;
          }
        }

        // Comments starting with '#'
        if (stream.sol() && stream.match(/^\s*#.*$/)) {
          return 'comment';
        }

        // Whitespace (style like Ace)
        if (/\s/.test(stream.peek())) {
          stream.eatWhile(/[ \t]+/);
          return 'whitespace';
        }

        // Delegate to JSON mode when in body, mapping styles to Ace-like classes
        if (state.inBody) {
          // Let JSON mode advance the stream
          var style = jsonMode.token(stream, state.jsonState);
          var tok = stream.current();

          // Map punctuation
          if (tok === ':') return 'punctuation colon';
          if (tok === ',') return 'punctuation comma';
          if (tok === '{' || tok === '[' || tok === '(') return 'paren lparen';
          if (tok === '}' || tok === ']' || tok === ')') return 'paren rparen';

          // Map primitives
          if (style === 'number') return 'constant numeric';
          if (style === 'atom') {
            var lc = tok.toLowerCase();
            if (lc === 'true' || lc === 'false')
              return 'constant language boolean';
            if (lc === 'null') return null; // leave null unstyled to mimic sample
          }
          if (style === 'string') {
            // Detect if this string is a JSON key: next non-space is ':'
            var s = stream.string,
              i = stream.pos,
              ch;
            while (i < s.length && ((ch = s.charAt(i)) === ' ' || ch === '\t'))
              i++;
            if (s.charAt(i) === ':') return 'variable';
            return 'string';
          }
          // Default: pass through
          return style;
        }

        // Request line: METHOD path?query
        if (!state.methodSeenOnLine && stream.match(METHODS, true)) {
          state.methodSeenOnLine = true;
          state.inQuery = false;
          state.queryExpect = 'param';
          state.expectBody = /^(POST|PUT|PATCH)\b/i.test(stream.current());
          return 'method';
        }

        // Headers support (e.g., Content-Type: application/json)
        if (stream.sol() && stream.match(/^[A-Za-z][A-Za-z0-9_-]*\s*:/)) {
          // Header name already consumed by match; style it similar to Ace's header name
          return 'header_name';
        }

        // URL and path pieces
        var ch0 = stream.peek();
        if (ch0 === '/') {
          stream.next();
          return 'url slash';
        }

        // Query string parsing
        if (ch0 === '?') {
          stream.next();
          state.inQuery = true;
          state.queryExpect = 'param';
          return 'url questionmark';
        }

        // Equals and ampersand
        if (ch0 === '=') {
          stream.next();
          state.queryExpect = 'value';
          return 'url equal';
        }
        if (ch0 === '&') {
          stream.next();
          state.queryExpect = 'param';
          return 'url ampersand';
        }

        // Param value (quoted) or path/query segments
        if (ch0 === '"' || ch0 === "'") {
          var quote = stream.next();
          var escaped = false,
            ch;
          while ((ch = stream.next()) != null) {
            if (ch === quote && !escaped) break;
            escaped = !escaped && ch === '\\';
          }
          if (state.inQuery) {
            return state.queryExpect === 'param' ? 'url param' : 'url value';
          }
          return 'url part';
        }

        // Part names and values (unquoted): read until whitespace or delimiter
        if (!/\s/.test(ch0)) {
          stream.eatWhile(/[^\s\/?&#=]/);
          if (state.inQuery) {
            return state.queryExpect === 'param' ? 'url param' : 'url value';
          }
          return 'url part';
        }

        // Fallback: consume one char to avoid infinite loops
        stream.next();
        return null;
      },

      lineComment: '#',
      helperType: 'http-request',
    };
  });

  // A simple MIME alias for convenience
  CodeMirror.defineMIME('text/x-http-request', 'http-request');
});
