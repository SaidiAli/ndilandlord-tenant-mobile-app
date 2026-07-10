# Multi-Currency (UGX + USD) — Tenant Mobile App Plan

Backend reference: `verit-server/docs/multi-currency-server-plan.md`.

A tenant's lease is in a single currency (UGX or USD), snapshotted server-side. The app only needs to
**display** the right currency and **gate mobile-money payment** for non-UGX leases.

## Formatting

- Replace any hardcoded `UGX`/`formatUGX` rendering with a currency-aware `formatMoney(amount, currency)`
  (UGX 0 decimals, USD 2 decimals).
- Read `currency` from the row it belongs to:
  - Lease → `lease.currency`
  - Payment / payment history → `payment.currency`
  - Payment schedule → `schedule.currency`
  - Invoice → `invoice.currency`
- Screens to audit: lease, payment-schedule, payment-history, payments tab, home/index balances,
  payment receipts.

## Payment flow (critical)

- **Mobile money is UGX-only.** For a **USD lease**, hide/disable the "Pay with mobile money" button and
  show copy like: "This lease is billed in USD. Please arrange payment with your landlord directly (bank
  transfer / cash) — mobile money is not available for USD."
- The payment-initiation endpoint returns **400** (`error: "Mobile money supports UGX only"`) for a
  non-UGX lease; handle it gracefully as a fallback even if the button is hidden.
- Payment amounts and outstanding balances are always shown in the lease currency; do not convert on the
  client.

## Notes

- Tenants never choose a currency — it comes from the lease.
- Realtime payment/socket updates carry the same `currency` field; render with `formatMoney`.
