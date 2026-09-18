# Enrollment tokens

The **Enrollment tokens** module lists the enrollment tokens the Wazuh server has minted, and
allows an administrator to create, review, revoke and purge them. It is the counterpart of the
**Enrollment token** step of the **Deploy new agent** wizard: the wizard mints a token for a
single deployment, while this module manages the collection over time.

The module appears in the left navigation as **Enrollment tokens**, in the **Agents management**
category.

## What an enrollment token is

An **enrollment token** is the credential a Wazuh agent presents when it enrolls with a manager.
A single token carries three things:

- The **manager address** the agent connects to, as `host[:port][/path]`.
- A **pin** of the manager's certificate authority, so the agent can verify the listener it is
  talking to.
- An **enrollment credential**, unless the token was minted without one.

Because the token names the manager and carries the credential, it replaces both the
`WAZUH_MANAGER_ENDPOINT` and the `WAZUH_REGISTRATION_PASSWORD` deployment variables rather than
accompanying them. See
[Agent deploy one-liner](../../agent-deploy-one-liner.md#enrollment-token) for how the wizard
builds the deployment command around it.

> **Important**
> The token text is returned only in the response that mints it. It is never part of the listing
> and cannot be recovered afterwards. A token that was not saved when it was created has to be
> replaced by a new one.

## The listing

The module opens on a table of the tokens the manager holds, newest first. The table is read
from the Wazuh Server API (`GET /agents/enrollment-tokens`) one page at a time, and the sort and
the pagination are applied by the manager rather than in the browser.

| Column          | Shown by default | Description                                                                                |
| --------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| **Status**      | Yes              | The state the token is in. See [Token states](#token-states).                              |
| **Created**     | Yes              | When the manager minted the token.                                                         |
| **Description** | Yes              | The free text supplied at creation time, so a token can be told apart from the others.     |
| **Uses**        | Yes              | How many agents have enrolled with the token, against the number of enrollments it allows. |
| **Expires**     | Yes              | When the token stops authorizing enrollments.                                              |
| **Actions**     | Yes              | Opens the details of the token, or revokes it.                                             |
| **ID**          | No               | The identifier the manager assigned to the token. It is what a revocation refers to.       |
| **Address**     | No               | The manager address the token names.                                                       |
| **Credential**  | No               | Whether the token carries an enrollment credential.                                        |

Use the column selector above the table to turn the optional columns on. The selection is
remembered between visits.

The search field applies the manager's own free-text filter over the whole collection, not only
over the page being displayed. It is not restricted to a single field: an identifier, an address
or a description all match it.

### Token states

The listing reports the facts about a token — whether it was revoked, when it expires, how many
times it has been used — and the module derives the state from them:

| State         | Meaning                                                               |
| ------------- | --------------------------------------------------------------------- |
| **Active**    | The token still authorizes enrollments.                               |
| **Revoked**   | The token was revoked by an administrator. It remains in the listing. |
| **Expired**   | The lifetime of the token has elapsed.                                |
| **Exhausted** | The token has reached the number of enrollments it allows.            |

A token that allows an unlimited number of enrollments is never exhausted. The last three states
are what the manager considers a **dead** token, and they are what a purge restricted to dead
tokens removes.

## Create a token

Select **Create token** to open the creation panel. The action requires the
`enrollment_token:create` permission.

| Field                   | Required | Description                                                                                                                                                        |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Address**             | Yes      | The name agents connect to. It must be one of the names in the manager listener certificate; the manager refuses an address outside it.                            |
| **Port**                | No       | Written into the token when it differs from the port the manager is configured with.                                                                               |
| **Path prefix**         | No       | Written into the token when it differs from the prefix the manager is configured with.                                                                             |
| **Lifetime**            | No       | A number of seconds, or a number followed by `d`, `h`, `m` or `s`. Left empty, the manager applies its default of 30 days.                                         |
| **Enrollments allowed** | No       | How many agents the token can enroll. Left empty, or set to `0`, the token allows unlimited enrollments.                                                           |
| **Description**         | No       | Free text kept with the token on the manager and shown in the listing. It is not sent to the agent.                                                                |
| **Embed CA**            | No       | Carries the certificate authority inside the token instead of its pin, so the agent does not fetch it from the manager when it enrolls. It makes the token larger. |
| **Without credential**  | No       | Mints a token carrying only the address and the pin. It can point an agent at the manager, but it cannot authenticate the enrollment.                              |

Every optional field left empty is omitted from the request, so the manager applies its own
default rather than a value decided by the interface.

When the token is minted, the panel replaces the form with the result: the **token text**, the
**ID**, the **address** and the **expiry**. This is the only moment the token text is available.
Copy it before closing the panel.

Closing the panel with the form partially filled asks for confirmation before the entries are
discarded.

## Review a token

The inspect action of a row opens the full detail of the token: its **ID**, **address**,
**description**, **status**, **creation** and **expiry** dates, the **enrollments** it has used
against the number it allows, and whether it carries a **credential**. The token text is not part
of it.

## Revoke a token

The revoke action of a row asks for confirmation and then revokes the token by its identifier.
The action requires the `enrollment_token:delete` permission, and it is unavailable on a token
that is already revoked.

A revoked token can no longer authorize an enrollment, and it stays in the listing with the
**Revoked** state. Revoking does not affect the agents that already enrolled with it.

## Purge tokens

Select **Purge tokens** to remove tokens from the manager store. Purging is not the same as
revoking: a revoked token remains in the listing, a purged one is gone from it. The action
requires the `enrollment_token:delete` permission.

| Option                                    | Effect                                                                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dead tokens only**                      | Removes only the tokens that can no longer authorize an enrollment: revoked, expired or out of enrollments. A usable token is never touched. |
| **Every token, the usable ones included** | Empties the store. Agents that have not yet enrolled with a token still in use will no longer be able to.                                    |

**Dead tokens only** is the option selected by default.

## Permissions

The module reads and writes the tokens through the Wazuh Server API, which enforces the
permissions of the logged-in user.

| Action             | Required permission       |
| ------------------ | ------------------------- |
| List and review    | Read access to the tokens |
| **Create token**   | `enrollment_token:create` |
| **Revoke** a token | `enrollment_token:delete` |
| **Purge tokens**   | `enrollment_token:delete` |

Where `enrollment_token:create` is missing — including against a server whose RBAC policy
predates the action — the **Deploy new agent** wizard falls back to the enrollment password and
does not show its **Enrollment token** step.

## Related documentation

- [Agent deploy one-liner](../../agent-deploy-one-liner.md) — how a token is minted and consumed
  during an agent deployment.
