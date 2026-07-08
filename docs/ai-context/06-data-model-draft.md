# 06 Data Model Draft

## 1. Main Entities

### Tenant

Represents a company using ForgeOS.

Fields:
- `id`
- `name`
- `slug`
- `defaultLocale`
- `createdAt`
- `updatedAt`

### User

Represents a platform user.

Fields:
- `id`
- `name`
- `email`
- `createdAt`
- `updatedAt`

### TenantMembership

Connects users to tenants.

Fields:
- `id`
- `tenantId`
- `userId`
- `role`
- `createdAt`
- `updatedAt`

### Customer

Represents a customer/client.

Fields:
- `id`
- `tenantId`
- `name`
- `companyName`
- `email`
- `phone`
- `billingAddress`
- `shippingAddress`
- `notes`
- `createdAt`
- `updatedAt`

Privacy note:
- Customer contact data is sensitive business data.

### Product

Represents a product sold or manufactured.

Fields:
- `id`
- `tenantId`
- `name`
- `sku`
- `category`
- `description`
- `unit`
- `basePrice`
- `active`
- `createdAt`
- `updatedAt`

### ProductVariant

Represents a variation of a product.

Fields:
- `id`
- `tenantId`
- `productId`
- `name`
- `sku`
- `attributes`
- `createdAt`
- `updatedAt`

Example:
- Cup 250 ml
- Cup 330 ml
- Cup 500 ml

### Order

Represents a customer order.

Fields:
- `id`
- `tenantId`
- `customerId`
- `orderNumber`
- `status`
- `requestedDeliveryDate`
- `notes`
- `createdAt`
- `updatedAt`

### OrderLine

Represents one product/service line in an order.

Fields:
- `id`
- `tenantId`
- `orderId`
- `productId`
- `productVariantId`
- `quantity`
- `unitPrice`
- `notes`

### ProductionJob

Represents a manufacturing/printing job.

Fields:
- `id`
- `tenantId`
- `orderId`
- `orderLineId`
- `machineId`
- `status`
- `plannedStart`
- `plannedEnd`
- `actualStart`
- `actualEnd`
- `quantityPlanned`
- `quantityProduced`
- `quantityRejected`
- `operatorNotes`
- `createdAt`
- `updatedAt`

### TechnicalSheet

Represents setup and process instructions for a product/job.

Fields:
- `id`
- `tenantId`
- `productId`
- `productVariantId`
- `productionJobId`
- `title`
- `version`
- `setupInstructions`
- `qualityChecks`
- `troubleshootingNotes`
- `estimatedSetupMinutes`
- `estimatedThroughputPerHour`
- `createdAt`
- `updatedAt`

### Machine

Represents production equipment.

Fields:
- `id`
- `tenantId`
- `name`
- `type`
- `manufacturer`
- `model`
- `serialNumber`
- `status`
- `notes`
- `createdAt`
- `updatedAt`

### InventoryItem

Represents stocked material, product, consumable, or spare part.

Fields:
- `id`
- `tenantId`
- `name`
- `sku`
- `category`
- `unit`
- `quantityOnHand`
- `reorderPoint`
- `supplierId`
- `locationId`
- `notes`
- `createdAt`
- `updatedAt`

### Supplier

Represents a supplier.

Fields:
- `id`
- `tenantId`
- `name`
- `contactName`
- `email`
- `phone`
- `notes`
- `createdAt`
- `updatedAt`

### MaintenanceTask

Represents preventive or corrective maintenance.

Fields:
- `id`
- `tenantId`
- `machineId`
- `title`
- `type`
- `status`
- `scheduledDate`
- `completedDate`
- `notes`
- `createdAt`
- `updatedAt`

### MarketingAsset

Represents content or media for marketing.

Fields:
- `id`
- `tenantId`
- `title`
- `type`
- `status`
- `content`
- `locale`
- `createdAt`
- `updatedAt`

## 2. Relationships Between Entities

- Tenant has many Users through TenantMembership.
- Tenant has many Customers.
- Tenant has many Products.
- Product has many ProductVariants.
- Customer has many Orders.
- Order has many OrderLines.
- OrderLine may create one or more ProductionJobs.
- ProductionJob may reference a Machine.
- ProductionJob may reference a TechnicalSheet.
- Product/ProductVariant may have reusable TechnicalSheets.
- Machine has many MaintenanceTasks.
- Tenant has many InventoryItems.
- InventoryItem may reference Supplier.
- Tenant has many MarketingAssets.

## 3. Multi-Tenant Rules

- Every business entity must include `tenantId`.
- Queries must always filter by `tenantId`.
- Users must only access records for tenants where they have membership.
- Tenant ownership and admin permissions must be enforced.
- Never rely only on frontend filtering for tenant security.

Tenant-scoped entities:
- Customer
- Product
- ProductVariant
- Order
- OrderLine
- ProductionJob
- TechnicalSheet
- Machine
- InventoryItem
- Supplier
- MaintenanceTask
- MarketingAsset

Platform-level entities:
- User
- Tenant
- TenantMembership

## 4. Data Privacy Considerations

Sensitive:
- Customer data
- Supplier data
- Order details
- Pricing
- Production notes
- Internal company processes
- Marketing lead data

Rules:
- Do not commit real customer data.
- Use seed/demo data only.
- Avoid logging customer contact details.
- AI features should minimize data sent to external APIs.

## 5. Unknowns and Assumptions

Assumption:
- PostgreSQL is suitable for the primary database.

Assumption:
- A relational schema is preferable due to orders, jobs, inventory, and tenant relationships.

Assumption:
- JSON fields may be useful for flexible technical sheet parameters, but core operational fields should remain structured.

Open Question:
- Should production sheets be reusable templates, job-specific records, or both?

Open Question:
- Should inventory track stock movements from day one?

Open Question:
- Should pricing and quotes be included in MVP?

Open Question:
- Should file uploads/artwork be stored in the app from MVP?
