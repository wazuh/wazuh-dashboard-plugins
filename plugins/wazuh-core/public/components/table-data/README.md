# TableData

This is a generic table data component that represents the data in pages that is obtained using a parameter. When the pagination or sorting changes, the parameter to get the data is executed.

# Layout

```
title? (totalItems?) postTitle? preActionButtons? actionReload postActionButtons?
description?
preTable?
table
postTable?
```

# Features

- Ability to reload the data
- Ability to select the visible columns (persist data in localStorage or sessionStorage)
- Customizable:
  - Title
  - Post title
  - Description
  - Pre action buttons
  - Post action buttons
  - Above table
  - Below table
  - Table columns
  - Table initial sorting column
