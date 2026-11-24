# Luqma Owner Dashboard — Phase 2 Store Management Review

A responsive Luqma dashboard for restaurant **Owners only**. Account/profile
integration remains real, the Luqma visual system is preserved, and Store
operations stay safety-blocked when the API cannot prove which restaurant
belongs to the signed-in Owner or whether the Owner may mutate it.

## Run locally

```bash
npm install
npm run dev
```

The application redirects unauthenticated visitors to `/login`.

```bash
npm run build      # typecheck + production build
npm run preview
npm run lint
npm run typecheck
npm test
```

## API configuration

The public API base URL is centralized in `src/lib/api/config.ts`:

```text
https://luqma-api.runasp.net
```

It may be overridden with the public build-time value `VITE_API_BASE_URL` (see
`.env.example`). No secret, password, or token belongs in that value.

## Integrated before Phase 2

- `POST /api/Account/Login` — existing integration retained with an exact
  `Owner` role gate. `Admin`, `User`, mixed-case, numeric, missing, and unknown
  roles are denied.
- `POST /api/Account/Logout` — sends the captured Bearer token with no request
  body, clears local/session and protected in-memory state first, and never
  leaves the user locally authenticated if remote logout fails.
- `GET /api/Account/GetProfile` — parses the supplied envelope and profile
  example, then validates the returned role is exactly `Owner`.
- `PUT /api/Account/UpdateProfile` — sends exactly the four documented fields,
  validates input, does not assume email confirmation, and refreshes the
  displayed profile after success.
- `GET /api/MainCategory/GetAll?onlyActive=true` — read-only parsing with active
  filtering and `displayOrder` preservation. No platform category controls are
  exposed.

All protected calls use the centralized API client in
`src/lib/api/client.ts`, which attaches Bearer tokens and normalizes 401, 403,
network, timeout, HTTP, and malformed-response failures.

## Intentionally blocked by the contract

The public Swagger document was reviewed at
[`/swagger/v1/swagger.json`](https://luqma-api.runasp.net/swagger/v1/swagger.json)
and the workspace snapshot is in [`docs/api/swagger.json`](docs/api/swagger.json).
The detailed audit is [`docs/api/luqma-contract.md`](docs/api/luqma-contract.md).

The API does **not** currently document a verified mapping from the
authenticated Owner to a Store. `GetProfile` has no `storeId`, and
`Store/GetAll` has no response schema or owner-specific semantics. Therefore:

- Store and MenuCategory UI operations are not called with guessed or
  hardcoded IDs.
- MenuCategory requests require a backend-verified owner/store scope and fail
  before the network when it is missing or invalid.
- A response item from another store is rejected instead of rendered.
- Store Update never accepts or sends `ownerId`, `ownerEmail`,
  `ownerPassword`, or `isActive`; its guarded service is not wired to a form
  until the mapping and Owner permissions are documented.
- A reusable `src/lib/api/upload.ts` helper is ready for documented multipart
  flows. It appends exactly `File`, delegates Bearer handling to the shared API
  client, imposes no undocumented file type/size limits, and does not fabricate
  an icon URL from an undocumented response.
- `POST /api/Store/UploadIcon`, `PUT /api/Store/SetActive/{id}`, and
  `PUT /api/Store/Update/{id}` are reviewed but blocked: no verified
  Owner-to-Store mapping is available, and the inspected backend source
  authorizes these Store operations for `Admin,SuperAdmin`, not `Owner`.
- The safe Store Update serializer is covered and excludes `ownerId`,
  `ownerEmail`, `ownerPassword`, and `isActive`; it is not sent while Owner
  permission remains unconfirmed.
- MenuCategory's guarded upload adapter consumes the shared helper for future
  verified scopes. No Store or MenuCategory icon URL is changed from an
  undocumented response, and a failed upload leaves the current icon untouched.

The old platform-wide Store, customer, order, report, product, and category
management routes are not exposed in the Owner dashboard. The remaining
overview visuals are clearly labelled preview data and are not API results.

## Security notes

- The only dashboard role is the exact string **Owner**. Frontend checks do not
  replace backend authorization.
- Every future restaurant operation must use an owner-scoped mapping and the
  backend must independently authorize the token, store, and resource.
- Passwords are never persisted, read for Store updates, logged, or displayed.
- Session data is in `sessionStorage` because no HttpOnly-cookie contract was
  supplied. This is not equivalent to an HttpOnly Secure cookie.
- No refresh endpoint was documented; expiry clears the local session and
  requires sign-in again.
- No live authenticated API request was made. No authorized test account was
  supplied. Tests use mocked HTTP responses and synthetic values only.

## Architecture

- React 19 + TypeScript + Vite
- React Router with an Owner-only route guard
- Centralized Bearer-token API client
- Feature API/domain modules separated from UI models
- CSS Modules, Arabic/English localization, RTL/LTR, light/dark themes, and
  responsive layouts preserved
- Vitest mocked-HTTP tests for auth, profile, logout, categories, ownership
  guards, and API error handling

## Backend dependencies before Store operations can open

1. A documented Owner-scoped endpoint or response that maps the authenticated
   Owner to the permitted Store, including response schema and ownership rules.
2. Explicit deployed Owner permissions for Store Update, UploadIcon, and
   SetActive, reconciled with the inspected `Admin,SuperAdmin` source
   restrictions.
3. A response schema for icon uploads, including the field that carries the
   persisted icon URL. File type/size limits should also be documented if the
   backend requires them; the frontend currently invents none.
4. Response envelopes/items for Store and MenuCategory endpoints.
5. A single role serialization contract: Swagger currently lists numeric
   `UserRole` values while the supplied profile/login examples use string
   `Owner`.
