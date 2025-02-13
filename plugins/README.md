### **General Plugin Structure and Functionality**

A **plugin** in this context follows a **modular and organized structure**, dividing its functionalities into **thematic groups**. Each group contains specific applications, each with its own logic and components.

📂 **groups/** _(Folder containing different security areas)_
├── 📂 **<group-name>/** _(Example: cloud-security, endpoint-security, etc.)_
│ . ├── 📂 **apps/** _(Contains the applications within this group)_
│ . │ . └── 📂 **<app-name>/** _(Example: aws, docker, fim, etc.)_
│ . │ . . . ├── 📄 `application.tsx` _(Mounts the app and configures the UI)_
│ . │ . . . └── 📄 `<app-name>-app.tsx` _(Main React component for the app)_
│ . ├── 📄 `applications.ts` _(Lists available apps within the group)_
│ . ├── 📄 `constants.ts` _(Defines IDs, titles, and other constant values)_
│ . └── 📄 `index.ts` _(Exports the group)_
├── 📄 `category.ts` _(Defines app categories for the UI)_
├── 📄 `layout.tsx` _(Handles the general visual structure of the plugin)_
├── 📄 `side-nav.tsx` _(Configures the sidebar navigation items based on the groups and their apps)_
└── 📄 `types.ts` _(Defines TypeScript types for consistency and structure)_

---

### **Example of a Group and its Application**

Let’s take the **endpoint-security** group and an application called **malware-detection** as an example:

📂 **endpoint-security/**
├── 📂 **apps/**
│ . ├── 📂 **malware-detection/**
│ . ├── 📄 `application.tsx` _(Mounts the app and defines internal navigation)_
│ . └── 📄 `malware-detection-app.tsx` _(Contains the main UI and logic for the app)_
├── 📄 `applications.ts` _(Lists all apps within endpoint-security)_
├── 📄 `constants.ts` _(Stores app IDs and text labels for this group)_
└── 📄 `index.ts` _(Exports the group for use)_
