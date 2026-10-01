# Documentation

## 🎯 Document Focus and Perspective

The documentation should focus on **Wazuh dashboard as an independent product or application**, and not only at the level of Wazuh _plugins_ or excessive references to OpenSearch.

The main objective is for this to be a complete resource (**source of truth**) that reduces the need to rewrite responses to common or frequently asked questions.

## 💡 Content Strategy

The documentation should address the topic as follows:

### 1️⃣ **General Introduction (Entry Point)**

- Explain each Dashboard feature in general terms.
- Describe in general terms **what they allow the user to do** to leverage the data.
- A paragraph can be dedicated to each concept if they remain on the same page.

| Aspect            | Recommended Action                                                                                                               |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **Language/Tone** | Use a **more formal** and professional language.                                                                                 |
| **Commands**      | Avoid colloquial terms like "**paste**". It is suggested to use "Replace the _placeholder_ with..." or a more formal equivalent. |
| **Information**   | Provide **comprehensive documentation** to enable straightforward resolution of queries through direct reference links.          |

## 🔗 References to other Wazuh repositories

Do **not** link to other Wazuh repositories (`https://github.com/wazuh/<repo>/...`, for example
`wazuh/wazuh` or `wazuh/wazuh-dashboard`). Those URLs point to a specific branch, so they go stale
or send readers to documentation for the wrong version.

Use a **literal reference** instead: name the documentation and the navigation path to the
section, in italics, as it appears in that documentation's table of contents. For a file in
another repository, name the repository and the path in code format.

| Instead of                                                                                              | Write                                                                                      |
| :------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------- |
| `[Options](https://github.com/wazuh/wazuh/blob/5.0.0/docs/ref/getting-started/installation.md#options)` | See the manager documentation, _Wazuh Manager > Getting Started > Installation > Options_. |
| `[VERSION.json](https://github.com/wazuh/wazuh-dashboard/blob/main/VERSION.json)`                       | `VERSION.json` at the `wazuh-dashboard` repository                                         |

Links to files in this repository use relative paths (`../agent-deploy-one-liner.md#enrollment-token`).
