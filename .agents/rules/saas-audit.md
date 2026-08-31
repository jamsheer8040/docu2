---
name: SaaS Audit
description: Protocol to ensure backend schema changes and API updates are backward-compatible, seamlessly patch onto the live production app, and enforce 100% data isolation between SaaS tenants.
---

# SaaS Audit (Bulletproof Isolation & Backward Compatibility)

Always perform a "SaaS Audit" periodically when any changes are made in the code. This ensures all database schema changes and backend controllers are 100% backward-compatible, non-destructive, seamlessly patch onto the live production app, and rigorously maintain multi-tenant data isolation.

## Part 1: Schema & Deployment Safety
When building a new feature or modifying an existing one:
1. **Schema Check**: Ensure that all database model additions use safe, non-destructive defaults (e.g., `allowNull: false` with a `defaultValue`, or `allowNull: true`). Do not drop columns or rename existing columns in a way that would break historical data on the live app.
2. **Controller Check**: Ensure that backend API controllers gracefully handle old data and correctly map any newly added fields. Prevent crashes caused by missing fields from legacy data.
3. **Deployment Safety**: Ensure the update acts as an additive layer over the initial git pull version so it seamlessly patches to production with zero downtime or database errors.

## Part 2: Multi-Tenant Compliance Protocol (Bulletproof Isolation)
This protocol enforces strict data isolation in a multi-tenant SaaS architecture. It applies to all database interactions in the application to ensure that no tenant can ever access, modify, or delete another tenant's data.

### 1. Reads (Queries, Aggregations)
All read operations (`.findAll`, `.findOne`, `.count`, `.sum`) against tenant-scoped tables MUST forcefully append `tenant_id: req.user.tenant_id` to the `where` clause.
**Bad:** `Document.findAll({ where: { status: 'Active' } })`
**Good:** `Document.findAll({ where: { status: 'Active', tenant_id: req.user.tenant_id } })`

### 2. Writes (Creation)
All create operations (`.create`, `.bulkCreate`) MUST explicitly inject the tenant ID from the verified user session, overriding any payload provided by the client.
**Bad:** `Customer.create(req.body)`
**Good:** `Customer.create({ ...req.body, tenant_id: req.user.tenant_id })`

### 3. Updates (Modifications)
All update operations MUST:
A. Validate ownership by finding the record with `tenant_id: req.user.tenant_id`.
B. Strip `tenant_id` and `id` from the incoming payload so malicious actors cannot perform tenant-hopping attacks.
**Bad:** `model.update(req.body)`
**Good:** 
```javascript
const { id, tenant_id, ...safePayload } = req.body;
await model.update(safePayload, { where: { id: req.params.id, tenant_id: req.user.tenant_id } });
```

### 4. Deletes (Destruction)
All delete operations MUST restrict the scope to the current tenant.
**Bad:** `model.destroy({ where: { id: req.params.id } })`
**Good:** `model.destroy({ where: { id: req.params.id, tenant_id: req.user.tenant_id } })`

### 5. Exceptions
Only system-level administrative endpoints managed by "Super Admins" or "System Developers" operating on non-tenant-scoped master tables (like the `Tenants` table itself) are exempt. These exceptions must be explicitly annotated.
