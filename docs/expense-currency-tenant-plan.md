# Expenses are UGX-only — tenant app plan

Backend rule (server: `verit-server/docs/expenses-ugx-only-server-plan.md`): expenses are always paid in
**UGX**; reporting converts UGX → account currency for display.

## Impact: none required

The tenant app has **no expense surface** (expenses are a landlord/manager concept). Tenants create
maintenance requests but do **not** enter or view maintenance costs (`estimatedCost`/`actualCost` are set by
the landlord/manager and are not shown on any tenant screen). So this change requires **no tenant work**.

## Guardrail

The risk is live, not hypothetical: `tenantApi.getMaintenanceRequest` (`lib/api.ts:537`) returns
`MaintenanceRequestDetail`, which already carries `estimatedCost`/`actualCost`. The values sit in tenant
client state today — nothing but the absence of a render keeps them off screen.

If a tenant screen ever displays a maintenance cost, format it as **UGX**:

```ts
formatMoney(request.actualCost, 'UGX')      // correct
formatMoney(request.actualCost, lease.currency)  // WRONG — cost is not the lease currency
```

Those cost fields feed the auto-expense and expenses are UGX-only, so they are never the
property/account currency. Do not reuse any per-property currency helper for them. The type anchor
(`types/index.ts:120-121`) carries this note in a comment.

Tenant-facing money that *does* follow the property currency (rent, payments, invoices, statements) is
unaffected by this change and continues to use the lease/payment `currency`.

## Verification

No runtime retest is warranted — the tenant app makes no expense API call, so the server-side analytics
reshape (dropped `byCurrency`, added `fxApplied` on `/api/expenses/analytics`) cannot reach it. The
invariant is a grep guard:

```bash
cd verit-tenant-mobile-app
# must return only types/index.ts — any app/ or components/ hit means a cost is being rendered
grep -rn "estimatedCost\|actualCost" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules
# must return only the types/index.ts guardrail comment — any other hit means an expense
# surface (api method, screen, type) has crept into the tenant app
grep -rni "expense" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules
npm run lint
```
