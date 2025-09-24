

## Payment Link Pay Page (pay.nedapay.xyz)

This project includes a dedicated payment page that renders a payment link by its `id` at the path:

- `app/pay/[id]/page.tsx`

The production hostname for this page is:

- `https://pay.nedapay.xyz`

Examples:

- `https://pay.nedapay.xyz/pay/<linkId>?<queryParams>`


### Root Redirect

- The root path `/` performs an immediate server redirect to a demo payment link for quick product showcasing.
- Location in code: `app/page.tsx` using `redirect()` from `next/navigation`.
- Current target: `/pay/demo-payment-link?...` with demo query params.


### URL Structure

- Path parameter: `id` (a.k.a. `linkId`).
  - Used downstream by components (e.g., passed to `PayWithWallet` or `OfframpPayment`).
  - Does not need to match a DB record for the demo. Real links are expected to exist in the DB and be created via the API.

- Query parameters control the behavior and validation of the payment page.


### Supported Query Parameters

- Required for normal (on-chain) links:
  - `sig`: HMAC signature for the query string (see Signature section)
  - `to`: EVM address of the recipient (merchant)

- Optional for normal (on-chain) links:
  - `amount`: decimal string. If omitted or `0`, page treats as "Any Amount" link
  - `currency`: token symbol (e.g., `USDC`, `USDT`) used to preselect the token
  - `chainId`: EVM chain ID (e.g., `8453` for Base)
  - `description`: arbitrary text description
  - `token`: token symbol (alternate field used in some flows; `currency` takes precedence in the UI when present)

- Required for off-ramp links (linkType OFF_RAMP):
  - All of the above signature requirements still apply
  - `amount`: must be present and greater than 0
  - `currency`: must be present (fiat currency code or token depending on flow)
  - `offRampType`: `PHONE` or `BANK_ACCOUNT`
  - `offRampValue`: phone number or bank account number
  - `offRampProvider`: mobile network name or bank name
  - For `BANK_ACCOUNT`, `accountName` is also required

Notes:

- The page determines link type by checking `offRampType`. If present, it is treated as an off-ramp link; otherwise, it is a normal link.
- Validation logic lives in `app/pay/[id]/page.tsx`.


### Signature (HMAC) Requirements

- Real links are expected to include a valid HMAC signature of the query parameters (`sig`).
- The official creation endpoint at `app/api/payment-links/route.ts` builds the canonical query string and computes the signature using `HMAC_SECRET`.
- Creating links through that endpoint ensures the payment URL includes a correct signature.


### Demo Link Support

- For demos, the page accepts a special case:
  - `id=demo-payment-link`
  - `sig=demo-signature-for-showcase`
- This allows the root redirect to showcase the payment flow without needing a real signed link.
- See validation in `app/pay/[id]/page.tsx` where demo links are whitelisted.


### Payment Link Creation API

- Create payment links via `POST /api/payment-links`.
- The API validates inputs (including off-ramp requirements), computes the signature, persists the link, and returns a complete `url` pointing at `/pay/<linkId>?...&sig=<hmac>`.
- See: `app/api/payment-links/route.ts`.


### QR Code for Payment Links

- Endpoint: `GET /api/payment-links/qr/:id`
- Looks up the link by `linkId`, generates a QR PNG for the link’s `url`, caches it, and returns the image bytes as `image/png`.
- See: `app/api/payment-links/qr/[id]/route.ts`.


### Example Links

- Normal link (Any Amount; Base; USDC preselected):
  - `https://pay.nedapay.xyz/pay/sample-123?to=0xYourMerchantAddress&currency=USDC&chainId=8453&sig=<hmac>`

- Normal link (Fixed Amount 25 USDC):
  - `https://pay.nedapay.xyz/pay/fixed-25?amount=25&currency=USDC&to=0xYourMerchantAddress&chainId=8453&sig=<hmac>`

- Off-ramp link (BANK_ACCOUNT):
  - `https://pay.nedapay.xyz/pay/cashout-1?amount=100&currency=USDC&to=0xYourMerchantAddress&chainId=8453&offRampType=BANK_ACCOUNT&offRampValue=0123456789&offRampProvider=My%20Bank&accountName=John%20Doe&sig=<hmac>`

- Demo link used by root redirect:
  - `https://pay.nedapay.xyz/pay/demo-payment-link?amount=10&currency=USDC&description=Demo%20Payment%20-%20NedaPay%20Showcase&to=0x742d35Cc6634C0532925a3b8D8B7c4C0532925a3b&chainId=8453&sig=demo-signature-for-showcase`


### Developer Notes

- The pay page is a client component (`"use client"`) and reads query params via `useSearchParams()`.
- It renders two steps: a details view followed by a payment view. For normal links, users can change chain/token and optionally input a custom amount when `amount` is not provided.
- The `id` (`params.id`) is forwarded to underlying components as `linkId` and may be used for analytics or linking to the QR endpoint.
- If you change the query parameter schema, ensure `/api/payment-links` creation logic and the pay page validation remain consistent.