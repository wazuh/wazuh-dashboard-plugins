## Rules for Recognizing the Structure of an HTTP Request

1. **Allowed Methods**

- Only the following methods are recognized as valid:
  `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`.

2. **URL Identification**

- A URL is only considered valid if it is **preceded by a valid method**.
- In any other case, it is not interpreted as a URL.

3. **Comments**

- Comments are only recognized when they occupy a line by themselves.
- Optional whitespace is allowed before the `#`.
- Comments at the end of other lines are not allowed (e.g. `GET /path # not valid`).
- Comments must start with `#` after any optional spaces.

4. **Default JSON Structure**

- When none of the previous cases apply (method + URL or comment), everything is interpreted using **JSON syntax**.
- This means recognizing individually:

  - Opening and closing braces: `{`, `}`
  - Opening and closing brackets: `[`, `]`
  - Constants: `true`, `false`, `null`
  - Numbers (positive and negative, e.g. `1`, `-1`)
  - Strings
  - Numeric operators (e.g. `-`)
  - Separators: commas `,` and colons `:`
  - Properties (object keys)
