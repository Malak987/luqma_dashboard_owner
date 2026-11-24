# Luqma Dashboard — Visual Preview + Account Login Integration

A polished, responsive Luqma restaurant-management dashboard. The approved visual direction is preserved. The documented **`POST /api/Account/Login`** endpoint is integrated with strict Owner-only role gating; Admin is a valid backend role but is denied access to this dashboard. Management screens remain explicitly labelled demo data because their API contracts were not supplied.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite (default `http://127.0.0.1:5173`). The application redirects unauthenticated visitors to `/login`.

```bash
npm run build      # tsc --noEmit + production build
npm run preview    # serve the production build
npm run lint
npm run typecheck
npm test
```

## API configuration

The public base URL is centralized in `src/lib/api/config.ts`:

```text
https://luqma-api.runasp.net
```

It can be overridden only through the public build-time value `VITE_API_BASE_URL` (see `.env.example`). No secret belongs in that value. The default is the documented production URL.

## Integrated and verified

- **Login** — `POST /api/Account/Login` with the exact documented `{ email, password }` request.
- **Response validation** — `isSucceeded`, `data`, `userId`, `userName`, `role`, `token`, and `expiresAt`.
- **Role gate** — exactly `Owner` only. `Admin`, missing, empty, malformed, mixed-case, and unknown roles are rejected and no dashboard session is created.
- **Session initialization** — the login response identity is stored in `sessionStorage` with the access token and expiry. Passwords are never stored.
- **Route protection** — every dashboard route is wrapped by `RequireAuth`; direct URLs cannot bypass it. Navigation visibility is not treated as authorization.
- **Session expiry** — `expiresAt` is checked on load and periodically; an expired session is cleared and the user is sent back to login.
- **Bearer attachment** — one configured HTTP client (`src/lib/api/client.ts`) attaches the token to protected requests.
- **Error normalization** — network, timeout, HTTP, malformed response, unauthorized, forbidden, and business failures are mapped to localized login messages.
- **Local sign-out** — clears the stored session and protected client state, resets authorization, and redirects to login.

The login contract, role/expiry decisions, session storage, Bearer attachment, and error normalization are covered by 36 mocked-HTTP/unit tests. **No live API call was made**, because no authorized test account/environment was supplied.

## Blocked by missing API documentation

The audit details are in [`docs/api/luqma-contract.md`](docs/api/luqma-contract.md). In short:

| Endpoint | Status | Missing contract |
|---|---|---|
| `POST /api/Account/Logout` | Not called | Request body, response body, status codes |
| `POST /api/Account/ForgotPassword` | Not connected | Request/response schema |
| `POST /api/Account/ResetPassword` | Not connected | Fields, validation, token rules |
| `GET /api/Account/GetUserById/{id}` | Not called | Response schema |
| `GET /api/Account/GetProfile` | Not called | Response schema |
| `PUT /api/Account/UpdateProfile` | Not connected | Editable fields, response schema |
| `GET /api/Store/GetAll` | Not called | Exact data/pagination schema, auth/roles; read-only listing is insufficient for management |

No Swagger/OpenAPI or Postman collection was present in the workspace. The inline integration brief was the only API source. No endpoint, field, role, or successful operation was invented.

The local sign-out button works and clears the client session, but it does **not** call the logout endpoint. Server-side token revocation cannot be claimed until the logout contract is supplied.

## Demo data boundaries

All orders, restaurants, customers, categories, products, analytics, and notifications remain fictional local data in `src/data/mock.ts`. A persistent dashboard notice states that management APIs are not connected. Currency is EGP for this preview only.

The top-bar search, export/add/edit/status actions, profile photo upload, and notification settings that require backend operations show explicit “not connected” feedback rather than fake success.

## Authentication and security notes

- The only allowed dashboard role is exactly **Owner**. `Admin` remains a valid backend role but must use the future Admin Dashboard; no Admin session is created here.
- The access token is stored in `sessionStorage` because no HttpOnly-cookie contract was supplied. This is **not** equivalent to an HttpOnly Secure cookie; `sessionStorage` is readable by JavaScript/XSS. The tradeoff is documented in `docs/api/luqma-contract.md`.
- No refresh-token flow exists; no refresh endpoint was documented. Expiry requires sign-in again.
- The backend remains authoritative for authorization. Frontend route protection is not a security boundary on its own.
- No passwords, tokens, or raw server error bodies are logged or displayed.
- No `.env` file or secret is committed. `.env.example` contains only the public API base URL.
- CORS behavior has not been live-verified. If the browser blocks the API, the backend must allow the dashboard origin; this frontend does not change backend CORS/cookie configuration.

## Stack

- React 19 + TypeScript 5.9 + Vite 7
- React Router 7
- Lucide React icons
- Lottie React (lazy-loaded desktop login brand animation)
- Self-hosted Manrope (Latin) and IBM Plex Sans Arabic fonts via Fontsource
- CSS Modules + semantic CSS custom properties
- Vitest (mocked HTTP, formatting, localization, session, expiry and role tests)

## Brand assets

The supplied logo files and Lottie animations are documented, with SHA-256 hashes and usage notes, in [`src/assets/brand/README.md`](src/assets/brand/README.md). The official mark was not redrawn, recolored, or replaced.

## Preview screenshots

The `previews/` folder contains captured desktop, tablet, and mobile states. The original approved visual-preview screenshots remain for design/brand review. Integration-specific captures use a locally injected test session and no API calls:

- `login-en-light.png`, `login-en-dark.png`, `login-ar-light.png`, `login-ar-dark.png`
- `login-en-light-admin-denied.png`, `login-en-light-expired.png`
- `overview-en-light-integrated.png`, `overview-en-dark-integrated.png`, `overview-ar-light-integrated.png`, `overview-ar-dark-integrated.png`
- `overview-en-light-mobile-integrated.png`, `overview-ar-dark-mobile-integrated.png`
- `settings-ar-light-integrated.png`

## Known limitations

- Management pages are demo data, not API-backed.
- Logout is local-only pending the documented request/response contract.
- Forgot/reset/profile/update/Store management are not implemented pending contracts.
- No component/E2E browser suite; authorization is tested at the domain/guard-decision level with mocked HTTP. No live account was available.
- The supplied palette’s `inactiveNavigation` color is below WCAG AA contrast for small text; production should use a darker text token for labels while reserving it for inactive navigation/disabled states.
- Arabic uses Latin digits for tabular alignment. Numeral style, currency, locale variant, time zone, and date conventions still need owner approval.
- Charts keep a left-to-right time axis in both languages; chart mirroring needs an owner decision.
- No deployment or Git push was performed.
