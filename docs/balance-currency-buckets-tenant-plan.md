# Tenant app — balance currency buckets

Server change: `verit-server/docs/tenant-balance-currency-bug.md` (Resolution section).

> **STATUS (2026-07-27): follow-up implemented; end-to-end verification still owed.**
> Steps 1–4 of "Optional follow-up" are done (`types/index.ts`, `app/(tabs)/payments.tsx`,
> `app/(tabs)/index.tsx`, `components/ui/PaymentModal.tsx`, dev assert in `lib/api.ts:280`).
> `npx tsc --noEmit` and `npm run lint` are clean. The TL;DR's device check has **not** been run —
> the backend was not up (`localhost:4000` refused), so no UGX/USD lease was exercised. Three
> corrections to this plan's text are recorded at the bottom.

## TL;DR — the P0 needs no app change

`GET /payments/lease/:leaseId/balance` now returns `currency: 'UGX' | 'USD'`, which
`types/index.ts:344` has always declared required. The existing guards start behaving as designed:

- `app/(tabs)/payments.tsx:485` renders "Pay with mobile money" again for UGX leases.
- `app/(tabs)/payments.tsx:135, 141, 228` and `components/ui/PaymentModal.tsx:62` stop firing on UGX.
- `formatMoney(amount, balance.currency)` at `payments.tsx:468, 472` stops silently defaulting to UGX.

**Verify first, ship nothing:** point the app at a server carrying the fix, open Payments on a UGX lease,
confirm the button renders and a mobile-money payment completes end to end. Then confirm a USD lease still
shows `MOBILE_MONEY_UNAVAILABLE_MESSAGE` (`lib/currency.ts:3`) and no button.

## Optional follow-up — render the second currency

The response now also carries `balances: CurrencyBalance[]`, one bucket per currency on the lease:

```ts
interface CurrencyBalance {
  currency: Currency;
  paidAmount: number;
  outstandingBalance: number;
  minimumPayment: number;
  dueDate: string | null;
  nextPaymentDue?: string;
  isOverdue: boolean;
}
```

`balances[0]` is always the payable currency and mirrors the flat fields, so nothing breaks by ignoring it.
But on a currency-transitioned lease a tenant can owe old-currency arrears **and** new-currency rent, and
today the app shows only the first. Bring `app/(tabs)/payments.tsx:466-501` and `app/(tabs)/index.tsx`
in line with the per-currency treatment already in `app/screens/payment-schedule.tsx:86-113` (which
buckets totals and never sums across currencies — see its comment at lines 78-80):

1. Add `CurrencyBalance` and `balances: CurrencyBalance[]`, `monthlyRentCurrency: Currency` to
   `PaymentBalance` in `types/index.ts:342-352`. Keep the existing flat fields — the server keeps sending
   them, scoped to `balances[0]`.
2. Outstanding Balance card: render one row per `balances` entry instead of the single
   `formatMoney(balance.outstandingBalance, balance.currency)` at `:468`. Never add across entries.
3. `Monthly Rent` at `:472` should use `balance.monthlyRentCurrency`, not `balance.currency` — on an
   arrears-only lease the payable currency and the rent currency differ.
4. Mobile-money gating stays keyed on `balance.currency` (the payable one). A tenant with USD arrears and
   UGX rent can still pay the UGX side; the USD bucket is informational, matching the existing copy.

## Notes

- No new endpoint, no auth change, no query-key change (`["payment-balance", selectedLeaseId]`).
- `lib/api.ts:271` casts the payload with no runtime validation; a server missing `currency` will silently
  regress this to the broken state. Consider a dev-only assert in `getBalance`.
- The server still rejects USD mobile-money initiation with `400 "Mobile money supports UGX only"`, which
  the app already handles at `payments.tsx:104-105`. Keep that fallback.

## Corrections found while implementing

1. **Step 3 missed a second site.** `components/ui/PaymentModal.tsx:123` formatted `monthlyRent` with
   `balance.currency` exactly as `payments.tsx:472` did. Both now use `monthlyRentCurrency`. The modal's
   other reads (`outstandingBalance`, `paidAmount`, the `validatePaymentAmount` bound at `:71`) are flat
   mirrors of `balances[0]` and are correctly in `balance.currency` — left alone.
2. **Flat `dueDate` is now nullable** (`string | null` per the shipped server shape), which the plan did not
   call out. `payments.tsx` called `formatDateShort(balance.dueDate)` unconditionally, and
   `formatDateShort` is `format(new Date(date), "PP")` (`lib/utils.ts:7-9`) — `new Date(null)` is the epoch,
   so a fully-paid bucket would have rendered **"Next Due: Jan 1, 1970"**. The row is now conditional on
   `primaryBalance.dueDate`.
3. **Dashboard `payments.currency` is optional, not required.** `tenantService.ts:225` and `:396` default it
   to `undefined` when there is no lease or the balance lookup throws, so `TenantDashboardData.payments`
   types it `currency?: Currency` with `balances: CurrencyBalance[]` (server defaults `[]`).

Implementation notes:

- `payments.tsx` derives `{ primaryBalance, otherBalances }` in a `useMemo`, falling back to synthesizing a
  single bucket from the flat fields when `balances` is absent, so an older server still renders. Secondary
  buckets are filtered to `outstandingBalance > 0`.
- The dashboard tile stays on the payable currency and discloses other buckets in its subtitle
  (`"Overdue · + USD 1,200 owed"`) — `MetricCard` takes a single `value` string
  (`components/ui/Card.tsx:30-37`), so a second amount cannot be a peer row there.

## Still to do

Run the TL;DR device check against a server carrying the fix: UGX lease → button renders and a mobile-money
payment completes; USD lease → `MOBILE_MONEY_UNAVAILABLE_MESSAGE` and no button; transitioned lease → the
old-currency bucket appears as its own `+ …` row and is never added to the primary total.
