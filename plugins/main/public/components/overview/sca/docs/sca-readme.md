# SCA Documentation

## 🛡️ MainSca Component – Functionality and Context

## 📌 What is this component?

`MainSca` is the main component of the **SCA (Security Configuration Assessment)** module within the Wazuh dashboard.  
It provides a visual summary of the compliance status of the security policies evaluated by Wazuh agents.

It allows users to quickly see, for each policy associated with an agent, how many checks were:

- ✅ Passed
- ❌ Failed
- 🚫 Not Run

---

## 🧠 What is it for?

SCA allows verification that endpoints comply with predefined security standards.  
This component provides a quick view of compliance per agent, displaying checks and policies.

It is useful for both security analysts and technical users who want to ensure that agents are correctly configured according to policies such as **CIS**, **NIST**, and others.

---

## 🔄 How does the data get here?

This component retrieves data directly from the **Wazuh Indexer**, which stores the results of SCA scans **persisted by the agent**.

As introduced in the feature [States persistence (#29533)](https://github.com/wazuh/wazuh/issues/29533):

1. The Wazuh agent persists the state of its modules locally.
2. It constructs and sends the state messages directly to the Wazuh server.
3. The server forwards those messages to the Indexer using the `wazuh-states-sca*` index pattern.

> ✅ This removes the need for `rsync` and reduces network traffic between the agent and server.

---

## ⚠️ Technical Notes

- Data is retrieved from the `wazuh-states-sca*` index.
- In the agent details view, the `search()` function is used with a filter by `agent.id`.
- In the dashboard, an HOC is used to obtain the index pattern.
- SCA sample data is available for development/testing.

---

## 🔗 Useful Resources

- 📘 [Wazuh - Official SCA Documentation](https://documentation.wazuh.com/current/user-manual/capabilities/sec-config-assessment/index.html)
- 🧱 [Issue #29533 - States persistence (GitHub)](https://github.com/wazuh/wazuh/issues/29533)
