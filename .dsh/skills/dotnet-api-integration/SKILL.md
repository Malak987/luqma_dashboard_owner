---
name: dotnet-api-integration
description: "Use when consuming the existing Luqma ASP.NET Core REST API: reconciling Swagger/OpenAPI with the Postman collection, documenting endpoints and DTOs, implementing typed API services, auth and token handling, and loading, success, empty, and error states. Never invents endpoints or fields and never modifies the backend or database."
whenToUse: "Load before any work that reads or writes Luqma API data, when adding an endpoint or DTO, when Swagger and Postman disagree, when implementing authentication or token refresh, or when mapping API errors and pagination. Do not load to design a screen or to change backend behavior."
---

# .NET API Integration

## Mission

Integrate the Luqma dashboard with the existing ASP.NET Core API exactly as it is, using the Swagger/OpenAPI document and the Postman collection as the contract, typed services at the data boundary, and honest loading, success, empty, and error states.

The backend is a fixed external system. The frontend adapts to it; the backend is not changed to fit the frontend.

## When to use this skill

Activate when:

- Reading or writing any Luqma API resource.
- Documenting an endpoint, request DTO, response DTO, status code, or error shape.
- Reconciling Swagger/OpenAPI with the Postman collection.
- Implementing or changing authentication, authorization headers, token storage, or refresh.
- Implementing pagination, filtering, sorting, search, or server-side state.
- Mapping API failures into UI states or form validation.
- Adding or reviewing typed API services, repositories, or mappers.

Do not use this skill to invent a backend capability, bypass a permission, or change the .NET project. Those are out of scope and require a separate owner decision.

## Hard boundaries

- Consume the existing API only.
- Do not modify the .NET backend, its configuration, its authorization policies, or its database.
- Do not create a new backend, database, migration, or mock production service.
- Do not add an endpoint, field, query parameter, response property, status code, or enum value because it would be convenient.
- Do not "temporarily" call an undocumented endpoint. Verify it first.
- Do not read or write production data. Use only an owner-approved development or test environment.
- Do not copy real tokens, connection strings, customer records, or Postman environment secrets into the repository, tests, fixtures, or logs.

## Source intake

Locate and read, together:

1. **Swagger/OpenAPI**
   - The live Swagger JSON/YAML for the target environment, or a saved copy the owner confirms is current.
   - Version (OpenAPI 2.0/Swagger or 3.x), `servers`/`basePath`, `securitySchemes`, `components`/`definitions`, tags, and operation-level overrides.
   - Request and response examples, enums, formats, nullability, required fields, and status codes.

2. **Postman collection**
   - Collection format version (prefer v2.1), folders, requests, inherited auth, headers, query parameters, body modes, examples, and tests.
   - Environment variables and collection variables. Record names and purposes only; never copy secret values.
   - Pre-request scripts that alter auth, timestamps, or IDs, because they can change what the request actually sends.

3. **Owner confirmation**
   - Which environment is authoritative for the current work.
   - Which source is current when the two disagree.
   - Any endpoint that is intentionally internal, deprecated, or not for the dashboard.

If only screenshots exist, you do not have an API contract. Stop and request the Swagger document and Postman collection.

## Reconcile the two sources

Neither Swagger nor Postman is automatically correct. Reconcile operation by operation and record every discrepancy before writing code.

Normalize first:

- Base URL, API version segment, trailing slashes, and path casing.
- Postman `:id` versus OpenAPI `{id}` path templates.
- Collection-level versus request-level auth and headers.
- Environment variables such as `{{baseUrl}}` resolved to the target environment.
- Content types (`application/json`, `multipart/form-data`, `application/x-www-form-urlencoded`).
- Optional versus required fields, including defaults applied by ASP.NET Core model binding.

Compare for each operation:

| Area | Check |
|---|---|
| Existence | Is the endpoint present in both? Is one deprecated or missing? |
| Method and path | Same verb, path, version, and casing? |
| Parameters | Path, query, and header names; required; types; defaults; allowed values |
| Request body | Shape, nested objects, arrays, enums, nullability, content type, file fields |
| Success response | Status code, envelope, field names, types, nullability, example |
| Error responses | Status codes and error body shape, including validation errors |
| Authentication | Scheme, header/cookie name, scopes/roles, token location |
| Pagination/filtering | Parameter names, page-size limits, sort syntax, response metadata |
| Examples | Do Postman examples match the OpenAPI schema? Are they current? |
| Localization | Does the API accept `Accept-Language` or return localized content? |

Discrepancy register:

```text
ID: API-0001
Operation:
Swagger says:
Postman says:
Observed or documented evidence:
Impact if we guess wrong:
Resolution: pending owner / confirmed by owner
Decision reference:
```

Do not resolve a discrepancy by choosing the source that is easier to implement. If the owner cannot confirm, implement only the verified parts and mark the affected UI or flow blocked.

## Contract inventory

Produce a durable inventory before building features. A proposed location is `docs/api/luqma-contract.md`, pending owner approval; do not create project documentation outside the skill pack until implementation is authorized.

For each endpoint, document:

```text
Name:
Method and path:
Purpose:
Authentication:
Required permissions/roles:
Path parameters:
Query parameters (type, required, default, allowed values):
Request DTO (fields, types, required, nullable, format):
Success status and response DTO:
Error statuses and error DTO:
Pagination/filter/sort behavior:
Idempotency or concurrency behavior:
Localization behavior:
Swagger reference:
Postman reference:
Discrepancies / notes:
```

Rules for the inventory:

- Use the contract's names for DTO fields, even if the UI uses different labels.
- Record nullability and optionality exactly. A field that is absent in one example is not automatically optional.
- Record money and quantity types exactly. Do not assume `number`; ASP.NET Core may serialize decimals as numbers or strings depending on configuration.
- Record date and time formats, time zones, and whether values are dates, date-times, or time-only.
- Record enum representations (string, number, flags) and every documented value.
- Record pagination metadata exactly; do not assume `items`/`totalCount`.

## ASP.NET Core specifics to verify, not assume

These are common patterns, not Luqma facts. Confirm each in the actual contract or a captured response:

- JSON property naming, usually camelCase but configurable.
- `ProblemDetails`/`ValidationProblemDetails` for errors, if configured; the `errors` dictionary shape for field validation.
- `401 Unauthorized` versus `403 Forbidden` semantics and whether the token or the permission is the cause.
- JWT bearer, cookie, API key, or mixed authentication; token location and scheme.
- Token response fields, expiry, refresh endpoint, rotation, and revocation behavior.
- `DateTime`, `DateTimeOffset`, `DateOnly`, and `TimeOnly` serialization; UTC versus local values.
- Decimal precision, money representation, and rounding.
- Nullable reference type behavior and whether optional fields are omitted or sent as `null`.
- Enum serialization as strings or integers.
- Pagination envelope and maximum page size.
- Validation rules enforced by the server that the client must reflect for UX.
- `Accept-Language`, localization of server messages, and fallback behavior.
- CORS and cookie attributes (`Secure`, `SameSite`, domain) for the dashboard origin.
- Rate limiting, concurrency tokens, idempotency keys, and correlation IDs.
- Whether soft-deleted or inactive records appear in list responses.

If a behavior is not evidenced, it is unverified and must not be encoded.

## Typed API layer

Keep all HTTP and mapping outside UI components.

```text
lib/http/client.ts        configured Axios instance, interceptors, error normalization
lib/http/errors.ts        ApiError taxonomy and helpers
features/<f>/api/dto.ts   DTO types mirroring the contract
features/<f>/api/map.ts   DTO -> domain mapping, including null/format handling
features/<f>/api/<f>.ts   one typed function per endpoint
features/<f>/api/keys.ts  query-key factory
features/<f>/domain/*     domain types, pure rules, formatters
features/<f>/hooks/*      query and mutation hooks
```

Requirements:

- One configured HTTP client with the approved base URL from public environment configuration.
- Set `Accept: application/json` and the verified `Accept-Language` behavior.
- Inject authentication only in the way the contract specifies.
- Normalize errors once, at the client boundary.
- One typed function per endpoint with explicit parameter and return types.
- DTOs mirror the contract; domain models use the shapes the UI needs.
- Mappers handle nullable fields, decimal strings, dates, enums, and absent optional values explicitly.
- Do not expose Axios responses or DTOs directly to components.
- Do not use `any`; use `unknown` for unverified payloads and narrow at the boundary.
- If generating types from OpenAPI, treat generation as an owner-approved tooling decision. Generated types are a starting point; reconcile them with Postman and the live contract. Never generate from a stale or unconfirmed document.
- Keep endpoint URLs out of components and hooks; they belong in the API module.

## Authentication and sessions

Implement only behavior the backend verifiably supports.

1. Identify the scheme from `securitySchemes` and Postman auth. Do not assume bearer tokens.
2. Identify the login/refresh/logout endpoints and their exact request and response fields from the contract.
3. Decide storage and refresh with `frontend-quality-security`; token storage is a security decision, not an API convenience.
4. If refresh is documented, implement a single-flight refresh, retry the original request at most once, and avoid loops. If refresh fails, clear the session and redirect to sign-in.
5. If refresh is not documented, do not invent it. Handle `401` by ending the session and redirecting.
6. If cookies are used, set `withCredentials` only when CORS and cookie attributes are verified. CSRF handling follows the backend contract.
7. Do not decode a JWT and trust its roles or permissions for authorization. Decode only for non-security display if the owner approves; the server remains authoritative.
8. Clear query caches, in-memory state, and stored session data on sign-out or user switch.
9. Preserve a safe return path after session expiry; validate it to prevent open redirects.

Never store credentials, refresh tokens, or long-lived access tokens in a place the security skill has not approved.

## Error model

Normalize every failure into a small, typed taxonomy the UI can render consistently:

```text
network        no response, DNS, connection failure
timeout        configured request timeout
unauthorized   401, session missing or expired
forbidden      403, authenticated but not allowed
validation     400/422 with field errors
notFound       404
conflict       409, concurrency or state conflict
rateLimited    429
server         5xx
unknown        anything unmapped
```

For each error, preserve safe metadata: status, a stable error code if the API supplies one, field errors, and a request/correlation ID if available. Do not preserve or display raw stack traces, SQL errors, tokens, or server internals.

UI rules:

- Map validation errors to form fields when the shape is verified.
- Show a localized, human-readable message; do not surface arbitrary server text without review.
- Distinguish "not found" from "no data" and from "not allowed".
- Provide a retry path for transient failures and a way back for terminal failures.
- Announce asynchronous errors accessibly.
- Log only sanitized diagnostics, never personal data or tokens.

## Loading, success, empty, and error states

Every API-backed view must define all four, plus the applicable auth states:

| State | Required behavior |
|---|---|
| Initial loading | A design-approved skeleton or progress treatment; avoid layout shift |
| Background refresh | Keep existing data visible and indicate refreshing without blocking |
| Success | Render the approved layout with real data |
| Empty | Distinguish no records yet, no results for filters, and no access |
| Error | Localized message, retry where meaningful, safe diagnostics |
| Unauthorized | Redirect to sign-in or show session-expired treatment |
| Forbidden | Explain that access is denied; do not pretend data is empty |
| Partial | Render available data and identify what failed, if the contract permits |

Do not show a spinner forever. Do not show an empty state while a request is still failing. Do not show a success toast before the server confirms success.

## Pagination, filtering, sorting, and search

- Implement server-side behavior only where the API supports it. Verify parameter names, defaults, limits, and response metadata.
- Keep page, page size, sort, filters, and search in the URL when users should be able to refresh, share, or navigate back.
- Do not fetch the entire dataset and paginate on the client unless the owner explicitly approves and the dataset is verified small.
- Keep the previous page visible while the next page loads when the UX calls for it.
- Debounce search input and cancel superseded requests.
- Respect the API's maximum page size.
- Handle first page, last page, zero results, and out-of-range pages.
- Do not invent a filter parameter the API does not expose.

## Mutations

- Disable or guard duplicate submissions while a mutation is pending.
- Map server validation errors back to the form.
- Invalidate only the queries affected by the mutation, using the key factory.
- Use optimistic updates only when the owner approves, the operation is reversible, and rollback is implemented.
- Send an idempotency key if and only if the API documents one.
- Confirm destructive actions according to the approved design; do not rely on a toast as the only confirmation.
- Do not assume success from a `200`; verify the documented success status and response.

## Contract drift and runtime validation

- Types are compile-time only. If the backend may change independently, consider runtime validation at the API boundary, but only with owner approval and a measured cost.
- When a response does not match the contract, fail safely: show an error state, log sanitized metadata, and report the discrepancy. Do not silently coerce malformed data into a plausible shape.
- Keep a small set of sanitized contract fixtures for tests. Update them when the owner confirms a contract change.
- Do not write a "fallback" that guesses a field name when the expected one is absent.

## Testing

- Unit-test mappers, error normalization, and pagination parameter building with contract fixtures.
- Integration-test API functions against a mocked HTTP boundary or an injected repository; assert auth headers, query parameters, status handling, and error mapping.
- Component-test the loading, success, empty, error, unauthorized, and forbidden states.
- End-to-end-test critical API flows only against an owner-approved test environment, with test accounts and no production data.
- Never use real customer data, production tokens, or production database connections in tests.
- If a mock server is used, label it clearly as a development aid and do not let it become the contract.

## Anti-patterns

- `fetch` or `axios` inside a component.
- Guessing a field because the name "should" be `totalCount`, `items`, `accessToken`, or `refreshToken`.
- Casting an API response to a UI type with `as`.
- Using `any` to silence a contract mismatch.
- Hardcoding the API base URL or environment-specific hosts in source.
- Copying a Postman token into a file, test, or commit.
- Storing a refresh token in `localStorage` or `sessionStorage`; the security skill prohibits it.
- Implementing refresh against an endpoint that does not exist.
- Client-side pagination of a full dataset.
- Ignoring request cancellation when filters change quickly.
- Showing `403` as an empty list.
- Logging request bodies that contain customer or payment data.
- Using a Vite development proxy as if it were a production CORS solution.

## Definition of done

- [ ] Endpoints, DTOs, status codes, errors, auth, and pagination are documented from both sources.
- [ ] Every discrepancy is recorded and resolved or explicitly blocking.
- [ ] No undocumented endpoint, field, or behavior is used.
- [ ] HTTP and mapping live outside UI components.
- [ ] Types are explicit; no `any` or unsafe assertions at the boundary.
- [ ] Loading, refresh, success, empty, error, unauthorized, and forbidden states are handled.
- [ ] Token and refresh behavior matches verified backend behavior and the security skill.
- [ ] Tests cover mappers, error mapping, and the key request shapes.
- [ ] No backend, database, secret, or production data was touched.

## Shared project contract

1. Approved UI screenshots are the visual source of truth.
2. Swagger/OpenAPI and the Postman collection are the API contract references, and both must be analyzed.
3. The existing ASP.NET Core backend remains unchanged.
4. No new database or backend is created.
5. React components never contain API business logic.
6. Arabic and English must work throughout the application.
7. RTL and LTR must be fully supported.
8. Performance must be measured, never claimed.
9. Important operations must have appropriate tests.
10. Existing business rules are never changed silently.
11. Undocumented API behavior is never assumed; ask the owner.
12. New dependencies and architectural changes require explicit owner approval.

## Related skills

- `luqma-dashboard-context` — contract conflicts, approval gates, decision log.
- `react-clean-architecture` — layer boundaries and typed services.
- `frontend-quality-security` — token storage, authorization, validation, tests.
- `dashboard-performance` — query caching, pagination, and request volume.
- `arabic-english-rtl` — localized content and `Accept-Language`.
- `design-to-code` — rendering the states and screens faithfully.
