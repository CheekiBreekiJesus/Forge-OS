# Data Import Staging

Milestone 1 creates an import-staging architecture without importing real JH Gomes data.

## Supported Import Types

- items;
- products;
- variants;
- suppliers;
- supplier items;
- customers;
- customer products;
- barcodes;
- packaging configurations;
- inventory opening balances;
- locations;
- label templates.

## Row State

Each staged row stores original values, normalized values, errors, warnings, duplicate candidates, proposed action and approval state.

Rows with missing references, invalid units, invalid costs, duplicate active barcodes or ambiguous mappings remain in review. No field or row should be silently discarded.

