# 03 Domain Knowledge

## 1. Important Domain Concepts

### Manufacturing SME

A small or medium manufacturing business usually needs to manage:
- Customers
- Orders
- Materials
- Machines
- Production jobs
- Stock
- Deliveries
- Maintenance
- Documentation
- Quotes
- Marketing

### JH Gomes

JH Gomes is the first deployment target.

Known business activity:
- Personalized cup printing
- Hospitality consumables
- Plastic cups
- Packaging-related products

Known cup sizes:
- 250 ml
- 330 ml
- 500 ml

Known printing process:
- UV screen printing line
- Production depends on cup size, setup, machine tuning, and operator workflow.

## 2. Business Rules

Known JH Gomes production assumptions:
- Product sizes include 250 ml, 330 ml, and 500 ml cups.
- Setup change between 330 ml and 250 ml is relatively fast.
- 500 ml setup is longer and closer to machine limits.
- Reject tolerance is approximately 1–2%.
- Labor baseline previously discussed: 15 €/hour.
- Setup time baseline previously discussed: 30 minutes.
- Production speed varies by cup size and tuning.

Known approximate throughput:
- 330 ml: approximately 2500 cups/hour
- 250 ml: approximately 2300 cups/hour
- 500 ml: approximately 1800 cups/hour

Important:
- These figures are operational estimates, not universal system constants.
- Store them as configurable tenant/product/machine parameters.

## 3. Operational Workflows

### Cup Printing Workflow

Typical high-level workflow:
1. Receive customer request.
2. Confirm cup size.
3. Confirm quantity.
4. Receive or prepare artwork/logo.
5. Prepare production setup.
6. Configure machine for cup size.
7. Print test pieces.
8. Validate print quality.
9. Run production.
10. Track rejects/stops.
11. Pack order.
12. Deliver/ship order.

### Technical Sheet Workflow

A production technical sheet should capture:
- Product/cup model
- Cup size
- Artwork/logo reference
- Quantity
- Ink/color details
- Machine setup notes
- Screen/squeegee setup if relevant
- Expected speed
- Setup checklist
- Quality checks
- Troubleshooting notes
- Operator notes

### Inventory Workflow

Expected inventory tracking:
- Product/material stock
- Consumables
- Packaging
- Cups by size/type
- Ink
- Spare parts
- Supplier references
- Reorder thresholds

### Maintenance Workflow

Expected maintenance tracking:
- Machines
- Sensors
- Preventive tasks
- Breakdowns
- Spare parts used
- Technician/operator notes
- Downtime

## 4. User Roles

Suggested roles:
- Owner
- Admin
- Production manager
- Machine operator
- Warehouse operator
- Sales/admin
- Marketing user
- Viewer

Not yet confirmed:
- Final permission matrix.

## 5. Glossary of Important Terms

| Term | Meaning |
|---|---|
| ForgeOS | Industrial Operating System SaaS platform |
| Tenant | A company using ForgeOS |
| JH Gomes | First deployment tenant |
| WMS | Warehouse Management System |
| CRM | Customer Relationship Management |
| CMMS | Computerized Maintenance Management System |
| ERP | Enterprise Resource Planning |
| Production Job | A specific manufacturing/printing task |
| Technical Sheet | Operational setup sheet for a job/product |
| UV Screen Printing | Printing process used for cups |
| Setup Change | Machine configuration change between product types |
| Reject Rate | Percentage of defective pieces |
| Throughput | Production output per hour |
| i18n | Internationalization |
| pt-PT | Portuguese Portugal locale |

## 6. Edge Cases Codex Should Understand

- A tenant may have different machines, products, workflows, and naming conventions.
- JH Gomes-specific details should be configurable, not hardcoded.
- Production speeds are estimates and should be overrideable.
- Factory users may have low technical tolerance; UI must be simple.
- Orders may arrive urgently by phone and need quick entry.
- Setup notes may be more useful than rigid forms in early MVP.
- Some data may start incomplete; the system should support drafts/incomplete records.
- A product may have multiple production configurations.
- One customer order may contain multiple cup sizes or product types.
- Inventory can include raw materials, finished products, consumables, and spare parts.
