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

  // JSON is used as the default syntax for any non-request line

  CodeMirror.defineMode('http-request', function (config) {
    var jsonMode = CodeMirror.getMode(config, {
      name: 'javascript',
      json: true,
    });

    return {
      startState: function () {
        return {
          methodSeenOnLine: false,
          inQuery: false,
          queryExpect: 'param', // 'param' | 'value'
          jsonState: CodeMirror.startState(jsonMode),
        };
      },

      token: function (stream, state) {
        if (stream.sol()) {
          state.methodSeenOnLine = false;
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

        // Helper: map JSON mode tokens to our classes
        function tokenFromJson() {
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
            if (lc === 'true' || lc === 'false' || lc === 'null')
              return 'constant language';
          }
          if (style === 'string') {
            // Detect if this string is a JSON key: next non-space is ':'
            var s = stream.string,
              i = stream.pos,
              ch;
            while (i < s.length && ((ch = s.charAt(i)) === ' ' || ch === '\t'))
              i++;
            if (s.charAt(i) === ':') return 'string property';
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
          return 'method';
        }

        // URL recognition ONLY on lines that start with a valid method
        if (state.methodSeenOnLine) {
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

          // Fallback inside request line: consume one char to avoid infinite loops
          stream.next();
          return null;
        }

        // Default to JSON syntax for all other content
        return tokenFromJson();
      },

      lineComment: '#',
      helperType: 'http-request',
    };
  });

  // A simple MIME alias for convenience
  CodeMirror.defineMIME('text/x-http-request', 'http-request');
});
