# CardFlip API Endpoint Reference

> Auto-generated from `src/services/` — the definitive contract for the backend.

---

## Base Configuration

| Setting | Value |
|---------|-------|
| Base URL | `VITE_API_BASE_URL` or `http://localhost:5000/api` |
| Auth | Bearer token in `Authorization` header |
| Cookies | `withCredentials: true` (httpOnly refresh token) |
| Content-Type | `application/json` (unless noted) |

---

## 1. Authentication (`/auth`)

### POST `/auth/register`
Create a new user account.

**Auth:** None

**Request Body:**
```json
{
  "phone": "string (required)",
  "password": "string (required)",
  "pin": "string (required, 6 digits)",
  "full_name": "string (required)",
  "referral_code": "string (optional)"
}
```

**Response `200`:**
```json
{
  "accessToken": "string (JWT)",
  "user": {
    "id": "uuid",
    "phone": "string",
    "email": "string | null",
    "full_name": "string",
    "profile_photo": "string | null",
    "kyc_status": "string",
    "referral_code": "string"
  }
}
```

---

### POST `/auth/verify-otp`
Verify phone OTP after registration or password reset.

**Auth:** None

**Request Body:**
```json
{
  "phone": "string",
  "otp": "string"
}
```

**Response `200`:** Success confirmation.

---

### POST `/auth/login`
Sign in with phone, password, and PIN.

**Auth:** None

**Request Body:**
```json
{
  "phone": "string",
  "password": "string",
  "pin": "string"
}
```

**Response `200`:** Same as `/auth/register` response.

---

### POST `/auth/refresh-token`
Refresh the access token using httpOnly cookie.

**Auth:** Cookie (refresh token)

**Request Body:** Empty `{}`

**Response `200`:**
```json
{
  "accessToken": "string (JWT)"
}
```

---

### POST `/auth/forgot-password`
Initiate password reset flow.

**Auth:** None

**Request Body:**
```json
{
  "phone": "string"
}
```

**Response `200`:** Success confirmation (OTP sent).

---

### POST `/auth/reset-password`
Reset password with OTP verification.

**Auth:** None

**Request Body:**
```json
{
  "phone": "string",
  "otp": "string",
  "new_password": "string"
}
```

**Response `200`:** Success confirmation.

---

### POST `/auth/logout`
Invalidate the current session.

**Auth:** Bearer token

**Response `200`:** Success confirmation.

---

## 2. Rates (`/rates`)

### GET `/rates`
Get all active card rates.

**Auth:** Bearer token

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "card_brand_id": "uuid",
    "brand_name": "string",
    "brand_logo": "string (URL)",
    "card_type": "string",
    "denomination": "string",
    "rate_per_dollar": "number",
    "is_active": "boolean"
  }
]
```

---

### GET `/rates/:brandId`
Get rates for a specific card brand.

**Auth:** Bearer token

**Response `200`:** Same array shape as above, filtered by brand.

---

## 3. Trades (`/trades`)

### POST `/trades/submit`
Submit a new gift card trade.

**Auth:** Bearer token  
**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required |
|-------|------|----------|
| `card_brand_id` | uuid | Yes |
| `card_type` | string | Yes |
| `denomination` | string | Yes |
| `quantity` | number | Yes |
| `ecode` | string | No |
| `card_image` | File | No (if ecode provided) |

**Response `201`:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "card_brand": "string",
  "card_type": "string",
  "denomination": "string",
  "quantity": "number",
  "card_image_url": "string | null",
  "ecode": "string | null",
  "naira_amount": "number",
  "status": "Pending",
  "admin_note": "null",
  "created_at": "ISO 8601",
  "updated_at": "ISO 8601"
}
```

---

### GET `/trades`
List user's trades with pagination.

**Auth:** Bearer token

**Query Params:**
| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `status` | string | all |

**Response `200`:**
```json
{
  "trades": [{ /* Trade object */ }],
  "total": "number"
}
```

---

### GET `/trades/:id`
Get a single trade by ID.

**Auth:** Bearer token

**Response `200`:** Single Trade object.

---

### GET `/trades/active`
Get user's currently active (non-terminal) trades.

**Auth:** Bearer token

**Response `200`:** Array of Trade objects.

---

## 4. Wallet (`/wallet`)

### GET `/wallet/balance`
Get user's wallet balance.

**Auth:** Bearer token

**Response `200`:**
```json
{
  "balance": "number",
  "currency": "string (e.g. NGN)"
}
```

---

### GET `/wallet/transactions`
List wallet transactions with pagination.

**Auth:** Bearer token

**Query Params:** `page` (number, default 1)

**Response `200`:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "credit | debit | fee",
      "amount": "number",
      "description": "string",
      "reference": "string",
      "created_at": "ISO 8601"
    }
  ],
  "total": "number"
}
```

---

### POST `/wallet/withdraw`
Withdraw funds to a bank account.

**Auth:** Bearer token

**Request Body:**
```json
{
  "amount": "number",
  "bank_account_id": "uuid",
  "pin": "string (6 digits)"
}
```

**Response `200`:** Success confirmation.

---

### POST `/wallet/add-bank`
Link a new bank account.

**Auth:** Bearer token

**Request Body:**
```json
{
  "bank_code": "string",
  "account_number": "string"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "bank_name": "string",
  "bank_code": "string",
  "account_number": "string",
  "account_name": "string",
  "is_default": "boolean"
}
```

---

### GET `/wallet/banks`
List user's linked bank accounts.

**Auth:** Bearer token

**Response `200`:** Array of BankAccount objects.

---

### DELETE `/wallet/banks/:id`
Remove a linked bank account.

**Auth:** Bearer token

**Response `200`:** Success confirmation.

---

## 5. Support (`/support`)

### GET `/support/tickets`
List user's support tickets.

**Auth:** Bearer token

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "trade_id": "uuid | null",
    "subject": "string",
    "status": "Open | Resolved | Closed",
    "created_at": "ISO 8601"
  }
]
```

---

### GET `/support/tickets/:id`
Get a ticket with its messages.

**Auth:** Bearer token

**Response `200`:**
```json
{
  "ticket": { /* SupportTicket object */ },
  "messages": [
    {
      "id": "uuid",
      "ticket_id": "uuid",
      "sender_id": "uuid",
      "message": "string",
      "attachment_url": "string | null",
      "created_at": "ISO 8601"
    }
  ]
}
```

---

### POST `/support/tickets`
Create a new support ticket.

**Auth:** Bearer token

**Request Body:**
```json
{
  "subject": "string",
  "message": "string",
  "trade_id": "string (optional)"
}
```

**Response `201`:** SupportTicket object.

---

### POST `/support/tickets/:ticketId/messages`
Send a message in a ticket.

**Auth:** Bearer token  
**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required |
|-------|------|----------|
| `message` | string | Yes |
| `attachment` | File | No |

**Response `201`:** SupportMessage object.

---

## 6. Referrals (`/referrals`)

### GET `/referrals/stats`
Get user's referral statistics.

**Auth:** Bearer token

**Response `200`:**
```json
{
  "total_referrals": "number",
  "total_earned": "number",
  "referral_code": "string",
  "referral_link": "string (URL)"
}
```

---

### GET `/referrals/history`
Get referral history.

**Auth:** Bearer token

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "referred_name": "string",
    "bonus_amount": "number",
    "is_paid": "boolean",
    "created_at": "ISO 8601"
  }
]
```

---

## 7. Notifications (`/notifications`)

### GET `/notifications`
Get all user notifications.

**Auth:** Bearer token

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "title": "string",
    "body": "string",
    "type": "string",
    "is_read": "boolean",
    "created_at": "ISO 8601"
  }
]
```

---

### PATCH `/notifications/read-all`
Mark all notifications as read.

**Auth:** Bearer token

**Response `200`:** Success confirmation.

---

## 8. Admin (`/admin`)

> All admin endpoints require **Bearer token + admin role**.

### POST `/admin/auth/verify`
Verify admin PIN for panel access.

**Request Body:**
```json
{
  "pin": "string (6 digits)"
}
```

---

### GET `/admin/dashboard/stats`
Get admin dashboard statistics.

**Response `200`:** Dashboard stats object (trade counts, revenue, user counts, etc.)

---

### GET `/admin/trades/pending`
List pending trades awaiting review.

---

### PATCH `/admin/trades/:id/approve`
Approve a trade.

**Request Body:**
```json
{
  "admin_note": "string (optional)"
}
```

---

### PATCH `/admin/trades/:id/reject`
Reject a trade.

**Request Body:**
```json
{
  "admin_note": "string (optional)"
}
```

---

### GET `/admin/trades`
List all trades (paginated).

**Query Params:** `page`, `status`

---

### GET `/admin/users`
List all users (paginated).

**Query Params:** `page`

---

### PATCH `/admin/users/:id/freeze`
Freeze/unfreeze a user account.

---

### GET `/admin/rates`
Get all rates (including inactive).

---

### POST `/admin/rates`
Create a new card rate.

**Request Body:**
```json
{
  "card_brand_id": "uuid",
  "card_type": "string",
  "denomination": "string",
  "rate_per_dollar": "number"
}
```

---

### PATCH `/admin/rates/:id`
Update a rate.

**Request Body:**
```json
{
  "rate_per_dollar": "number (optional)",
  "is_active": "boolean (optional)"
}
```

---

### GET `/admin/payouts/pending`
List pending withdrawal payouts.

---

### POST `/admin/payouts/:id/process`
Process a payout.

---

### GET `/admin/support/tickets`
List all support tickets.

---

### POST `/admin/support/tickets/:id/reply`
Reply to a support ticket.

**Request Body:**
```json
{
  "message": "string"
}
```

---

## Error Responses

All endpoints return errors in this shape:

```json
{
  "message": "Human-readable error description",
  "errors": [{ "field": "phone", "message": "Required" }]  
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error |
| 401 | Unauthorized / token expired |
| 403 | Forbidden (not admin, frozen account) |
| 404 | Resource not found |
| 409 | Conflict (duplicate phone, etc.) |
| 429 | Rate limited |
| 500 | Server error |

---

## Token Flow

1. **Login/Register** → returns `accessToken` (15min) + sets httpOnly `refreshToken` cookie (30d)
2. **On 401** → client auto-calls `POST /auth/refresh-token` with cookie → gets new `accessToken`
3. **On refresh fail** → clears token, redirects to `/signin`
