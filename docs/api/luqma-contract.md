# Luqma API Contract Audit — Dashboard Integration

**Base URL:** `https://luqma-api.runasp.net`
**Audit date:** 2026-11-23
**Status:** Partial integration. Login is implemented from the supplied contract. All other Account/Store operations are blocked because the supplied documentation does not include the request/response schemas needed to implement them without guessing.

## Sources reviewed

- The endpoint and schema details supplied directly in the integration task brief.
- The existing frontend source tree and its current mock-data assumptions.

**No Swagger/OpenAPI file, Postman collection, Postman environment, or other API document was present in the workspace.** No production endpoint was called during this audit. No Swagger URL was fetched. There is therefore no Swagger-vs-Postman comparison to report.

## Endpoint inventory

| # | Endpoint | Method | Documented request | Documented success response | Auth / roles | Status |
|---|---|---|---|---|---|---|
| 1 | `/api/Account/Login` | POST | `{ email, password }` | Envelope: `message`, `data { userId, userName, role, token, expiresAt }`, `isSucceeded`, `timestamp` | Anonymous; returns role for validation | **Implemented** against the supplied shape |
| 2 | `/api/Account/Logout` | POST | **Not supplied** | **Not supplied** | Bearer assumed by the brief, exact requirement not documented | **Blocked** — route only |
| 3 | `/api/Account/ForgotPassword` | POST | **Not supplied** | **Not supplied** | Not documented | **Blocked** — route only |
| 4 | `/api/Account/ResetPassword` | POST | **Not supplied** | **Not supplied** | Not documented | **Blocked** — route only |
| 5 | `/api/Account/GetUserById/{id}` | GET | Path `{id}`; ID type/format not supplied | **Not supplied** | Not documented | **Blocked** — route only |
| 6 | `/api/Account/GetProfile` | GET | No parameters documented | **Not supplied** | Bearer assumed by the brief, exact requirement not documented | **Blocked** |
| 7 | `/api/Account/UpdateProfile` | PUT | **Editable fields not supplied** | **Not supplied** | Not documented | **Blocked** |
| 8 | `/api/Store/GetAll` | GET | Query names supplied: `mainCategoryId`, `cuisineId`, `isOpenNow`, `isActive`, `latitude`, `longitude`, `pageNumber`, `pageSize` | Envelope with `message`, `data`, `isSucceeded`, `timestamp`; exact store fields and pagination metadata **not supplied** | Auth/roles not documented | **Blocked** — insufficient schema and read-only |

## Login contract implemented

```text
POST /api/Account/Login
Content-Type: application/json

{ "email": string, "password": string }
```

Documented response envelope:

```text
{
  message: string,
  data: {
    userId: string,
    userName: string,
    role: string,
    token: string,
    expiresAt: string
  } | null,
  isSucceeded: boolean,
  timestamp: string | number
}
```

Implementation rules:

- `isSucceeded` must be exactly `true`.
- `data` must be present.
- `role` must be exactly `Owner`; missing, empty, mixed-case, malformed, `Admin`, and unknown roles are rejected. No session is created.
- `userId` and `userName` must be non-empty strings.
- `token` must be a non-empty string; it is treated as opaque and never decoded for authorization.
- `expiresAt` must parse as a future date. The exact server date format was not documented; the implementation accepts any value `Date.parse` accepts and stores a canonical ISO string.
- `isSucceeded: false` is surfaced as a generic invalid-credentials failure. Raw server `message` text is not shown to the user.
- HTTP 401 from Login is treated as invalid credentials; 403 as forbidden; 5xx as a server failure; network/abort failures as network/timeout.

**Not documented for Login:** HTTP status codes for each outcome, error-body schemas, CORS allowed origins, token format/claims, clock-skew policy, and whether `timestamp` is a string or number.

## Missing contracts and exact blockers

### Logout — blocked

The brief names `POST /api/Account/Logout` and requires Bearer authentication, but does not document the request body, whether a body is accepted, the success status, or the response body. The instruction explicitly forbids assuming an empty body. The dashboard therefore clears the local session and redirects to login, but does **not** call the endpoint. Server-side token revocation cannot be claimed.

### ForgotPassword / ResetPassword — blocked

Both routes are named, but neither has a request schema, response schema, validation rules, token field name, confirmation field name, or delivery behavior. No form or API call was invented. The existing Forgot-password link shows a clear “not available” dialog.

### GetUserById / GetProfile — blocked

The paths are named, but no response schema was supplied. The dashboard therefore uses only the identity returned by the documented Login response (`userId`, `userName`, `role`). It does not call either endpoint and does not invent profile fields.

### UpdateProfile — blocked

The endpoint path is named, but no editable fields, validation rules, conflict behavior, or response schema were supplied. Settings therefore displays the authenticated identity read-only and does not send an update.

### Store/GetAll — blocked

The query parameter names and the four envelope keys are known, but the exact `data` structure, pagination metadata, auth requirement, and allowed roles are not. The endpoint is also documented only as a listing endpoint; no create/update/delete/activation endpoints were supplied. It cannot support the existing restaurant-management UI. No Store call or management operation was invented.

### Other dashboard features — not documented

No Order, Customer, Category, Product, Report, or Notification endpoints were supplied. Those screens remain explicitly labelled demo data.

## Authorization

- Allowed dashboard role: exactly `Owner`.
- `Admin` is a valid backend role but is **not authorized** for this dashboard; the future Admin Dashboard will handle administrative operations. No Admin session is created or retained.
- No additional roles or permissions are assumed. The route guard protects every dashboard route independently of navigation visibility.
- The backend remains the authority. Frontend route protection is not a substitute for server-side authorization on any future data endpoint.
- The Login role is stored in `sessionStorage` as part of the session. It is client-editable and must never be trusted by the backend for authorization. A stored `Admin`/unsupported role is rejected and cleared before any dashboard route renders.

## Token and session handling

- Access token storage: `sessionStorage` under `luqma.session`, together with `expiresAt` and non-sensitive identity fields.
- Rationale: no HttpOnly-cookie authentication contract was supplied. `sessionStorage` is not equivalent to an HttpOnly Secure cookie and is readable by JavaScript/XSS. This is a documented tradeoff, not a claim of equivalent protection.
- Passwords are never stored.
- Bearer attachment is centralized in `src/lib/api/client.ts`; components never build Authorization headers.
- No refresh endpoint or refresh contract was supplied; no refresh flow exists. Expiry clears the local session and requires sign-in again.
- A 401 on a protected API call triggers local session invalidation and login redirect.
- A 403 is surfaced as forbidden.
- Logout clears local state; the server-side logout call is blocked by the missing contract.

## Discrepancies

No Swagger/OpenAPI document and no Postman collection were supplied, so there is **no source pair to compare**. The absence of a discrepancy register must not be read as agreement between two contracts.

## Live verification

No production endpoint was called. No credentials, test accounts, or authorized live environment were supplied. Automated tests use mocked HTTP responses only. CORS and real API responses remain unverified until an owner-approved test account and environment are available.
