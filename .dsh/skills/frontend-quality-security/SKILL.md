---
name: frontend-quality-security
description: "Use when planning or reviewing Luqma dashboard tests, TypeScript strictness, accessibility, token and session handling, input validation, secrets, authorization boundaries, production builds, or Git diffs before accepting changes. Protects customer data and ensures important behavior is verified rather than assumed."
whenToUse: "Load before implementing or reviewing authentication and session code, forms and validation, tests, accessibility, production builds, dependency changes, or a pull request/diff. Also load when a change touches personal data, permissions, or release readiness."
---

# Frontend Quality and Security

## Mission

Ship a Luqma dashboard that behaves correctly, is accessible, protects customer data, and can be verified. Quality and security are acceptance criteria, not a final cleanup phase.

## When to use this skill

Activate when:

- Writing or reviewing unit, component, integration, or end-to-end tests.
- Touching authentication, tokens, sessions, logout, or permission-gated UI.
- Adding forms, validation, file uploads, or any user input.
- Handling personal data, customer records, order details, or error reporting.
- Preparing a production build or release.
- Reviewing a diff before accepting a change.
- Adding or updating a dependency.
- Checking accessibility of a screen or component.

Use it together with the task-specific skill; it does not replace API, design, or architecture guidance.

## Test strategy

Use the lowest layer that can prove the behavior. Do not push everything into end-to-end tests.

| Layer | Tool | What it proves | Minimum coverage |
|---|---|---|---|
| Unit | Vitest | pure rules, mappers, formatters, validation, guards | money/format edge cases, DTO mapping, permission helpers, error normalization |
| Component | Vitest + React Testing Library | user-visible behavior, states, accessibility roles | loading, success, empty, error, form validation, keyboard interaction |
| API integration | Vitest + mocked HTTP boundary or injected repository | request shape, auth headers, error mapping, pagination | success, 4xx, 5xx, timeout, 401/403 |
| End-to-end | Playwright | real workflows across routing, auth, and data | critical owner-approved flows, both locales, at least one RTL journey |

Test rules:

- Test behavior, not implementation details. Prefer roles, labels, and visible text over CSS classes and internal state.
- Use `userEvent`, not synthetic event dispatch.
- No arbitrary sleeps. Wait for a condition or use the framework's auto-waiting.
- Each test is independent and deterministic. Clean up data and state.
- Do not depend on test execution order.
- Do not use production data, production accounts, or production databases.
- Use sanitized fixtures derived from the confirmed contract, not invented response shapes.
- Mock at the HTTP or repository boundary, not by mocking a hook's internals.
- Cover error paths, not only the happy path.
- Keep snapshots small and intentional; a large snapshot is not a test strategy.
- Flaky tests are defects. Fix or remove them; do not retry until they pass.
- Coverage is a signal, not a target. Prioritize critical paths and complex rules.

### Critical end-to-end workflows

Confirm the actual dashboard scope with the owner, then cover the flows that exist. Typical candidates:

- sign-in, sign-out, and session expiry;
- first dashboard load with real permissions;
- list, search, filter, sort, and pagination;
- create and edit with client and server validation;
- destructive action with confirmation and cancellation;
- permission-denied and not-found routes;
- language switch with preserved route and state;
- an Arabic/RTL journey through a primary workflow.

Do not claim a flow is covered if the test only renders a component in isolation.

## TypeScript strictness

- `strict: true` is required.
- Do not introduce `any`. Use `unknown` at boundaries and narrow it.
- Enable and respect nullability. Treat `undefined` and `null` as distinct where the contract does.
- Consider `noUncheckedIndexedAccess` for new code; do not weaken existing safety to avoid a fix.
- Avoid type assertions (`as`) that silence a mismatch. Parse or validate instead.
- Avoid non-null assertions (`!`). If one is necessary, document the invariant.
- Use discriminated unions for request and UI state rather than contradictory booleans.
- Use `satisfies` for configuration and constant maps.
- Type route parameters, search params, environment values, and API payloads.
- Validate untrusted input with Zod or the approved schema library at the boundary.
- Run `tsc --noEmit` (or the project's typecheck script) before accepting a change.
- Do not disable rules inline without a comment explaining why and a plan to remove the exception.

## Accessibility

Target WCAG 2.1 AA or the owner-approved level; treat 2.2 AA as the preferred baseline for new work.

- Use semantic HTML first: buttons for actions, links for navigation, headings in order, lists for lists, tables for tabular data.
- Every form control has a programmatically associated label. Placeholders are not labels.
- Every image has appropriate alternative text; decorative images are marked as such.
- All interactive elements are keyboard reachable and operable.
- Focus is always visible and follows a logical order.
- Do not remove focus outlines without an approved, visible replacement.
- Dialogs and drawers trap focus, receive initial focus, close on Escape where appropriate, and restore focus on close.
- Route changes move focus to a meaningful heading or main region and announce the new page.
- Async status messages, errors, and toasts use appropriate live regions without being noisy.
- Tables have captions or accessible names, header cells, and scope where needed.
- Form errors are associated with their fields, summarized when necessary, and announced.
- Color is never the only way to convey state or meaning.
- Text and UI contrast meet the target; report approved-design conflicts.
- Motion respects `prefers-reduced-motion`.
- Touch targets are large enough for mobile use.
- Test with keyboard only and with a screen reader spot check for critical flows.
- An automated accessibility checker is useful but is a dependency decision; it does not replace manual checks.

## Sessions, tokens, and authorization

### Token storage

Choose deliberately and document the decision. There is no universally safe place in a browser; tradeoffs matter.

| Approach | Strength | Risk / condition |
|---|---|---|
| HttpOnly, Secure, SameSite cookie | JavaScript cannot read the token; strong XSS resistance | Requires backend support, correct CORS and cookie attributes, and CSRF protection |
| In-memory access token + HttpOnly refresh cookie | Limits persistent token exposure | Requires a verified refresh endpoint and careful reload behavior |
| `sessionStorage` | Cleared when the tab closes | Readable by XSS; not suitable for long-lived refresh tokens |
| `localStorage` | Survives tabs and restarts | Readable by any XSS; not acceptable for refresh tokens or long-lived sensitive tokens |

Rules:

- Prefer HttpOnly cookies when the backend supports them. The frontend cannot create or protect HttpOnly cookies by itself; verify backend behavior.
- Never store refresh tokens in `localStorage` or `sessionStorage`. If the backend offers no HttpOnly-cookie or in-memory option, stop and escalate to the owner rather than accepting the risk silently.
- Never put tokens in URLs, query strings, logs, analytics, or error reports.
- Do not store personal data in browser storage beyond what the feature needs.
- Clear tokens, cached queries, and user-specific state on logout and on user switch.
- Use a single session source of truth; do not keep copies in multiple stores.
- If refresh is implemented, do a single-flight refresh, retry once, and terminate the session on failure. Do not loop.
- Validate return paths after login or session expiry to prevent open redirects.
- Respect the backend's session lifetime and idle timeout. Do not extend it client-side.

### Authorization

- The backend is the authority for every permission decision.
- Hiding a button or route is user experience, not security. The server must still reject unauthorized requests.
- Do not trust a role or permission read from a JWT and treat it as final. Use it for UI hints only if the contract supports it, and always handle `403`.
- Do not cache another user's data after a session change.
- Do not expose admin-only data in a client bundle, a public route, or a hidden component.
- Handle `401` and `403` differently: re-authenticate versus explain the denial.
- Do not bypass authorization by calling an endpoint from the browser that the UI was supposed to gate. If it is not permitted for the user, it is not permitted.

## Secrets and environment variables

- Only public build-time values may use the `VITE_` prefix; Vite inlines them into the client bundle.
- Never put API secrets, client secrets, database credentials, admin keys, signing keys, or service-role keys in frontend code or `VITE_*` variables.
- Do not commit `.env` files containing secrets. Provide a documented `.env.example` with placeholder names when implementation begins.
- Do not print environment values in logs, errors, or build output.
- Do not embed secrets in source maps, test fixtures, or screenshots.
- Use the backend as the holder of privileged credentials. If the frontend needs a third-party service, use an owner-approved backend proxy or a public, restricted key designed for browser use.
- Review the built assets for leaked values before release.
- Treat Postman environments and collection variables as secret-bearing artifacts; never copy their values into the repository.

## Input validation and content safety

- Validate on the client for UX, and rely on the server as the authority.
- Validate at the boundary with a schema; do not scatter ad hoc checks.
- Mirror documented server constraints (required, min/max, pattern, enum, file type/size) and surface server validation errors.
- Do not allow a client-only rule to contradict the contract.
- Normalize and trim input carefully; do not silently change meaningful characters.
- Use `type`, `inputMode`, `autocomplete`, and `dir` appropriately; they are usability aids, not validation.
- Escape output through React by default. Avoid `dangerouslySetInnerHTML`.
- If rich HTML is unavoidable, sanitize it with an owner-approved library and a strict allowlist; never trust server or user HTML blindly.
- Validate URLs and redirect targets. Reject `javascript:` and unexpected protocols.
- For file uploads, validate type, size, and count on the client and require server enforcement.
- Be careful with CSV/formula injection if exporting data; neutralize leading formula characters according to the export format.
- Do not build HTML strings from untrusted data.

## CSRF and XSS

- XSS: avoid unsafe HTML, sanitize when necessary, keep dependencies current, and enforce a Content Security Policy at the deployment layer where possible. Frontend code cannot guarantee CSP without server/CDN configuration; document the requirement.
- CSRF: if authentication uses cookies, verify that the backend implements CSRF protection and follow its contract for tokens or headers. `SameSite` helps but is not a complete substitute. If the backend does not support CSRF protection, raise it as a risk before shipping cookie-based auth.
- Do not disable TLS verification, CORS protections, or browser security features to make development easier.
- A Vite development proxy is not a production CORS or security solution.

## Logging and personal data

Never log, report, or persist:

- tokens, passwords, cookies, authorization headers, or session identifiers;
- customer names, phone numbers, emails, addresses, payment details, or order notes;
- full request or response bodies that may contain the above;
- government identifiers or any data the owner classifies as sensitive.

Rules:

- Log stable, non-sensitive identifiers and status codes when diagnostics are needed.
- Scrub error reports before they leave the browser; configure the error-tracking tool's deny list if one is approved.
- Do not leave `console.log` in production code. Use the project's approved logging/telemetry facility and only with owner approval.
- Do not include sensitive data in analytics events, URLs, or page titles.
- Redact data in screenshots used for bug reports.
- Error messages shown to users should be helpful but not reveal internals.

## Production build review

Before accepting a release candidate:

- [ ] Typecheck passes.
- [ ] Lint passes or all exceptions are documented.
- [ ] Unit, component, and integration tests pass.
- [ ] Critical end-to-end tests pass against the approved environment.
- [ ] Production build succeeds.
- [ ] The built app runs from a production preview, not only the dev server.
- [ ] No secrets or private environment values appear in the output.
- [ ] Source maps follow the approved policy; do not publish them unintentionally.
- [ ] Bundle output is reviewed; no unexpected large chunk or unapproved dependency.
- [ ] Routes load directly (deep links) and unknown routes are handled.
- [ ] Both languages and directions work in the production build.
- [ ] Error and empty states work with the production API configuration.
- [ ] Console has no unexpected errors or warnings.
- [ ] Dependency audit results are reviewed, with known risks reported rather than silently ignored.

## Git diff review

Review the actual diff before accepting any change:

- [ ] `git status` and `git diff --stat` are understood; no unexpected files.
- [ ] Full diff reviewed, not just the summary.
- [ ] No backend, Flutter, database, migration, or infrastructure files were modified.
- [ ] No secrets, `.env` values, tokens, credentials, or personal data were added.
- [ ] No unrelated formatting, rename, or dependency churn.
- [ ] No generated artifacts, build output, coverage, or editor files committed accidentally.
- [ ] Tests were added or updated for the changed behavior.
- [ ] Types and public interfaces remain coherent.
- [ ] The change matches the approved design and contract.
- [ ] Commit, push, branch, and merge actions happen only with explicit owner approval.

## Dependency and supply-chain review

- Every new dependency needs a stated purpose, an owner approval, and a size/maintenance/license/security check.
- Prefer the existing stack and platform APIs.
- Check that the package is the intended one; typosquatting is real.
- Review transitive additions and lockfile changes.
- Do not add a package that duplicates an existing capability without a migration plan.
- Do not run install scripts from untrusted packages.
- Report known vulnerabilities; do not silently suppress audit findings.

## Definition of done

- [ ] Critical behavior is covered at the appropriate test layers.
- [ ] TypeScript strictness is preserved; no unexplained `any` or assertions.
- [ ] Accessibility checks pass for the changed screen, including keyboard use.
- [ ] Token, session, and authorization behavior matches the verified backend and the approved storage decision.
- [ ] No secrets or sensitive data are exposed in code, logs, storage, URLs, or build output.
- [ ] Input is validated on the client and server; output is escaped or sanitized.
- [ ] Production build, preview, and deep links were checked.
- [ ] The diff contains only intended changes, with no backend/Flutter/database edits.
- [ ] The change was reviewed before acceptance, and no commit or push happened without approval.

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

- `luqma-dashboard-context` — approval gates and protected business rules.
- `dotnet-api-integration` — auth contract, error mapping, and API tests.
- `react-clean-architecture` — typed boundaries and testable seams.
- `arabic-english-rtl` — localization and bidirectional accessibility.
- `dashboard-performance` — performance evidence and build review.
- `design-to-code` — visual and state fidelity.
