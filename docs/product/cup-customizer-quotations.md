# Cup Customizer — Quotations

## Create quotation

Action: **Create quotation from simulation**

- Creates draft `Quote` with `isEstimate: true`
- Links `Quote.simulationId` and `CustomizerSimulation.quoteId`
- Copies pricing snapshot, setup, quantity, print colours
- Includes assumption notes in quote notes
- Sets simulation status to `converted`

## Idempotent update

If simulation already has `quoteId` and quote is still **draft**:

- Re-converting updates the same quote line
- No duplicate quotation rows for the same simulation

If quote is no longer draft, conversion returns existing quote without mutation.

## Pricing required state

When commercial rule cannot resolve (`ruleId` null and no manual override):

- UI shows **Commercial data required**
- User may enter temporary manual unit price with reason
- Do not treat zero as a valid final price

## Customer requirement

Customer/lead optional during design. Validate before sending quote to customer outside ForgeOS.

## Inventory

Customizer does **not** post stock movements or mutate inventory ledger.
