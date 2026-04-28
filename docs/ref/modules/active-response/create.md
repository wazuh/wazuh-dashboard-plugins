# Create an active response

The following walkthrough shows how to create an active response that blocks the offending IP for 10 minutes when an SSH brute-force alert fires, and automatically unblocks it afterwards.

**Prerequisites:**

- Wazuh indexer, manager, and dashboard running version **5.0.0** or later.
- The `wazuh-active-responses*` index pattern available in **Stack Management → Index Patterns**. The dashboard creates it automatically at startup; contact your administrator if it is missing.

> **Note:** creating the active response only stores the executable name. For the remediation to actually run when the monitor fires, the executable must be available on the target agent — see [Concepts → About the executable](README.md#about-the-executable).

---

## Step 1: Open the Active Responses view

Inside the Wazuh Dashboard, open the side menu (top-left hamburger icon), expand **Explore**, and select **Active Responses**.

![Side menu - Explore → Active Responses](images/00-explore-menu-entry.png)

If no active responses have been created yet, the view shows an empty state with a **Create active response** button. Otherwise, the main screen is the list of existing active responses (see [Step 5](#step-5-verify-the-active-response-in-the-list)).

---

## Step 2: Open the creation form

Click **Create active response**. The form is organized in two panels: **Name and description** and **Configurations**.

![Create active response - Empty form](images/01-create-form-overview.png)

---

## Step 3: Fill the **Name and description** panel

- **Name** — required. For this example: `block-ip-10min`. An empty value shows the error `Active response name cannot be empty.`
- **Description** — optional. For this example: `Blocks the offending IP for 10 minutes via firewalld`.

![Create active response - Name and description](images/02-create-form-name-panel.png)

---

## Step 4: Fill the **Configurations** panel

Complete the fields in order:

- **Executable** — `firewalld-drop`. Required. This script is one of the default executables shipped with the Wazuh agent (see [Concepts → About the executable](README.md#about-the-executable)); enter only its name, without a path. An empty value shows the error `Executable name cannot be empty.`
- **Extra arguments** — leave empty for this example. Optional.
- **Type** — select `Stateful`. This makes the **Stateful timeout (seconds)** field appear.
- **Stateful timeout (seconds)** — `600` (ten minutes). Default: `180`. Validations: non-numeric values show `Stateful timeout must be a number.`; values `≤ 0` show `Stateful timeout must be greater than 0.`
- **Location** — keep `Local` (the default). For this use case, the block must apply on the agent that reported the SSH brute-force attempt, not on every agent in the environment — `All` would push the firewall rule to every agent and is rarely what you want. Switching to `Defined agent` makes the **Agent ID** field appear; it accepts only digits.

> **Important:** **Stateful timeout** and **Agent ID** are conditional. If you don't see them, check the value of **Type** or **Location** respectively.

![Create active response - Configurations](images/03-create-form-configurations.png)

The **Type** dropdown lets you choose between `Stateless` and `Stateful`:

![Type dropdown](images/04-create-form-type-dropdown.png)

The **Location** dropdown exposes the three targeting modes:

![Location dropdown](images/05-create-form-location-dropdown.png)

Selecting `Defined agent` reveals the **Agent ID** field, which must be a numeric agent identifier:

![Defined agent with Agent ID](images/06-create-form-defined-agent.png)

Selecting `Stateless` hides the **Stateful timeout** field, since it no longer applies:

![Stateless with Location = All](images/07-create-form-stateless-all.png)

> **Note:** the **Extra arguments** field is also labeled **Extra args** on the details page, and appears as `extra_arguments` when you inspect an execution record in **Discover**. They all refer to the same value.

---

## Step 5: Verify the active response in the list

Click **Create**. If any field is invalid, the toast `Some fields are invalid. Fix all highlighted error(s) before continuing.` is shown. When validation succeeds, a confirmation toast `Active response <name> successfully created.` appears and you are returned to the list.

The list exposes five columns: **Name**, **Status**, **Location**, **Type**, and **Description**. The filters above the table let you narrow results by **Status** (`Active` / `Muted`), **Location** (`All` / `Defined agent` / `Local`), and **Type** (`Stateful` / `Stateless`).

> **Note:** an active response with `Status = Muted` remains selectable inside triggers but will not execute until unmuted. Muting is a safer way to pause one temporarily than deleting it.

---

## Step 6: Inspect, edit, mute, or delete an active response

Clicking the **Name** in the list opens the details page. The header shows the name, the current status badge (`Active` / `Muted`), an **Actions** dropdown and a **Mute active response** / **Unmute active response** button. Below the header, two read-only panels reproduce the configuration:

- **Name and description** — shows **Active Response name**, **Description**, and **Last updated**.
- **Configurations** — shows **Executable**, **Extra args**, **Type**, **Location**, and (when applicable) **Stateful timeout** or **Agent ID**.

![Active response details](images/17-active-response-details.png)

Available actions from this page:

- **Mute active response / Unmute active response** (header button) — toggles the status. Muting opens a confirmation dialog: _"This active response will stop sending responses to its recipients. However, the active response will remain available for selection."_
- **Actions → Edit** — opens the edit form with the current values pre-filled.
- **Actions → Delete** — opens a confirmation dialog that requires typing the literal word `delete` before the confirmation button is enabled.

> **Important:** deleting an active response does **not** remove references to it from Alerting. Any trigger that still points to the deleted entry becomes a broken action. Review your monitors after every deletion, or prefer **Mute** for short pauses.
