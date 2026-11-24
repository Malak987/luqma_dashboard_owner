---
name: react-clean-architecture
description: "Use when structuring a Luqma dashboard feature, deciding where code belongs, adding hooks, services, repositories, or mappers, or reviewing React and TypeScript for layer boundaries, typing, component size, and overengineering. Keeps API and business logic out of UI components without adding unnecessary abstraction."
whenToUse: "Load before creating a feature module, moving code between layers, designing hooks or API services, choosing where state lives, or reviewing a dashboard pull request for architecture and TypeScript quality. Do not load to make a purely visual adjustment or to force a rewrite of working code that already follows the approved structure."
---

# React Clean Architecture

## Mission

Build the Luqma dashboard as a feature-based React application with clear presentation, domain, and data boundaries; strong TypeScript types; and the smallest amount of abstraction that keeps the code understandable, testable, and consistent.

The goal is not architectural purity. The goal is code where a new developer can find a screen, understand where its data comes from, change a rule safely, and test it without a browser.

## When to use this skill

Activate when:

- Creating a feature module, route, screen, shared component, hook, service, or repository.
- Deciding whether logic belongs in a component, hook, domain module, or API layer.
- Adding or changing server-state or client-state handling.
- Reviewing a component that is growing too large or mixes concerns.
- Introducing a dependency-inversion seam, mapper, schema, or generic abstraction.
- Reviewing TypeScript quality, nullability, or boundary typing.

Do not use this skill to justify a large refactor that the owner has not approved. Apply it to new and touched code; propose broader migrations separately.

## Proposed structure

This is the default proposal, pending owner approval and adaptation to the actual repository. Confirm the real project layout before creating directories.

```text
src/
  app/
    providers/          # QueryClient, i18n, theme, auth/session providers
    router/             # route definitions, guards, lazy boundaries
    layouts/            # application shell, sidebar, top bar
    error/              # route and root error boundaries
  components/
    ui/                 # design-system primitives shared across features
    feedback/           # shared empty, error, loading, confirmation patterns
  features/
    <feature>/
      api/              # endpoint functions, DTOs, mappers, query keys
      domain/           # pure types, rules, schemas, formatters
      hooks/            # query/mutation hooks and view-model hooks
      ui/               # feature screens and feature-only components
      index.ts          # the feature's public surface
  lib/
    http/               # HTTP client, interceptors, error normalization
    query/              # QueryClient configuration, shared query helpers
    env/                # validated public environment values
    format/             # locale-aware formatters
  i18n/                 # dictionaries, locale provider, direction handling
  routes/               # route-level composition if not under app/router
  styles/               # tokens and global CSS
  test/                 # setup, factories, server mocks
```

Adapt names to the repository's existing conventions. Do not introduce a second competing structure.

## Dependency rule

Dependencies point inward:

```text
ui  ->  hooks  ->  domain
ui  ->  components/ui, i18n, format
hooks  ->  api  ->  lib/http
api  ->  DTOs and lib/http
domain  ->  no React, no router, no axios, no browser storage
app  ->  composes features and shared infrastructure
```

- A feature's public `index.ts` is its boundary. Other features import from that surface, not from deep internal files.
- Shared cross-feature behavior belongs in `lib/` or `components/`, not in another feature's internals.
- `domain/` must be usable in a plain Vitest test with no DOM, router, or network.
- `ui/` may render domain types and call hooks; it must not call `axios`, `fetch`, or repository implementations directly.
- `api/` maps transport shapes to domain shapes. It does not import React.

If a dependency points the wrong way, fix the boundary rather than hiding the violation behind a shared mutable module.

## Layer responsibilities

| Layer | Owns | Must not own |
|---|---|---|
| `ui` | Markup, composition, visual states, user events, accessibility | HTTP, token handling, business calculations, DTO parsing |
| `hooks` | Query/mutation orchestration, view-model derivation, form wiring, invalidation | Raw endpoint URLs, DTO-to-domain mapping details, JSX |
| `domain` | Types, validation schemas, pure rules, mappers that do not depend on transport, formatters | React hooks, browser APIs, network calls |
| `api` | Endpoint functions, DTO types, transport-to-domain mapping, query-key inputs | Component state, navigation, toasts |
| `lib/http` | Base client, auth header injection, error normalization, cancellation, timeouts | Feature-specific endpoints or UI messages |
| `app` | Providers, router, layouts, guards, error boundaries | Feature business rules |

## API business logic stays out of components

This is a hard rule (shared contract rule 5), not a style preference.

- A component may call `useOrders()` or `useUpdateOrder()`. It may not call `axios.get('/orders')`.
- A component may render `order.total`. It may not compute the total from line items unless the owner has confirmed the exact rule and the calculation belongs in `domain/` with tests.
- A component may show a permission-based disabled state. It may not decide authorization; the server remains authoritative.
- A component may format a date through a locale-aware formatter. It may not reimplement date or currency rules inline.
- Toasts, redirects, and cache invalidation triggered by a mutation belong in the mutation hook or a small orchestration hook, not scattered across presentational components.
- If a component needs data, expose a hook with a clear contract. If the hook needs data, add an API function. Do not collapse these layers for speed.

## State ownership

Choose the narrowest state owner that works:

| State | Owner | Examples |
|---|---|---|
| Server data | TanStack Query | lists, details, counts, reference data |
| Shareable navigation state | URL / router | page, page size, sort, filters, tabs, search |
| Local UI state | `useState` / `useReducer` | open dialog, hover, expanded row, draft input |
| Cross-route client state | Zustand, only when necessary | sidebar collapse, multi-step wizard draft, global UI preference |
| Session/auth | Dedicated session mechanism | token or cookie handling per verified backend behavior |

Rules:

- Never copy server data into Zustand or component state as a second source of truth.
- Do not put ephemeral UI state in a global store.
- Do not put filters in local state if the user expects refresh, back/forward, or sharing to preserve them.
- Do not use Zustand to avoid passing props through two levels; composition is cheaper.
- Use Zustand when state is genuinely shared by unrelated routes or distant components, and document why.
- Keep query keys centralized in a factory; do not build key arrays ad hoc in components.

## Components

- A screen component composes; it should read like a layout, not like a data pipeline.
- Split when a component has multiple reasons to change: fetching, transforming, validating, and rendering distinct regions.
- Line count is a signal, not a law. A 250-line presentational table may be fine; a 90-line component that fetches, maps, validates, and renders is not.
- Prefer composition over configuration. Avoid components with many mutually exclusive boolean props.
- Keep one primary responsibility per component and one clear public API.
- Co-locate small feature-only components with the feature; promote to shared only on real reuse.
- Do not create a generic abstraction for a single use. Extract after the second or third real instance.
- Keep rendering pure. Do not trigger fetches or navigation as a side effect of render.
- Use error boundaries around routes and risky regions; use Suspense boundaries intentionally, not around every leaf.

## Hooks

- One hook, one concern. `useOrdersQuery`, `useOrderMutations`, `useOrderFilters` are clearer than `useOrdersEverything`.
- Query hooks return the query result and accept typed parameters. They do not render or navigate.
- Mutation hooks own invalidation, success/error side effects that are part of the operation, and pending state.
- Derive view models in a hook only when the derivation is reusable or non-trivial; simple formatting can stay in the component or a formatter.
- Keep effect usage minimal. Do not synchronize derived state with effects.
- Clean up subscriptions and timers.
- Do not hide a fetch inside a hook that looks like a pure selector.

## TypeScript

- Enable `strict`. Do not weaken it to accommodate legacy code.
- No `any`. Use `unknown` at trust boundaries and narrow explicitly.
- Type DTOs from the contract; do not let transport types leak into UI props by accident.
- Distinguish domain models from DTOs when names, nullability, enums, or formats differ.
- Model exclusive states with discriminated unions, not several booleans that can contradict each other.
- Use `readonly` for data that must not be mutated.
- Prefer string-literal unions over enums for app-level states; map numeric or string API enums explicitly.
- Use `satisfies` to validate object shapes without widening.
- Avoid non-null assertions. If one is unavoidable, state the invariant next to it.
- Handle `null` and `undefined` explicitly; do not rely on truthiness for values such as `0` or `""`.
- Validate untrusted input and API responses at the boundary when the contract is uncertain; do not scatter defensive parsing through components.
- Type environment access through a validated module; do not read `import.meta.env` throughout the app.

## Dependency inversion

Use it where it earns its keep:

- Swapping a real HTTP implementation for a test fake at a clean seam.
- Supporting more than one data source for the same domain operation.
- Isolating a volatile transport or storage detail from domain rules.
- Enabling domain tests without network or browser APIs.

Do not use it when:

- There is exactly one implementation and no test seam need.
- It would wrap every function in an interface with no behavioral variation.
- It introduces a DI container, decorators, or a class hierarchy for a CRUD call.
- A plain typed function and a module mock already test the behavior cleanly.

Prefer a small repository interface in `domain/` and an implementation in `api/` only when the seam is justified. Otherwise, a typed API function injected into a hook is enough.

## Overengineering guardrails

- No generic base repository, base service, or base component until at least three concrete cases prove the shared shape.
- No state library for one boolean.
- No custom HTTP framework around Axios beyond the needs actually present.
- No domain entity classes unless behavior and invariants justify them.
- No barrel file that re-exports an entire feature and defeats code splitting.
- No abstraction that makes a single call site harder to read.
- No speculative support for themes, plugins, or backends that are not in scope.
- No "clean architecture" folder ceremony without a boundary that is actually enforced.
- No refactor of unrelated code inside a feature change.

## Testing seams

- Pure domain rules and mappers are unit-testable without React.
- API functions are testable with a mocked HTTP boundary or an injected repository.
- Hooks are testable through a wrapper with a fresh QueryClient.
- Components are testable through user-visible roles and text, with hooks or the HTTP boundary mocked.
- End-to-end tests cover integration; do not attempt to prove every branch there.

Design the seam before the test needs it, but only where the test would otherwise be brittle.

## Review checklist

- [ ] The feature follows the approved folder structure and dependency direction.
- [ ] No component calls HTTP directly or contains business calculations.
- [ ] DTOs are mapped at the API boundary; UI props use domain/view types.
- [ ] Server state, URL state, local state, and global client state are owned deliberately.
- [ ] Query keys are centralized and stable.
- [ ] Components have one primary responsibility and a clear public API.
- [ ] Hooks have one concern and do not hide side effects.
- [ ] TypeScript is strict, with no `any` and no unexplained assertions.
- [ ] Abstractions are justified by real reuse or a real seam.
- [ ] The change does not include an unapproved refactor or dependency.

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

- `luqma-dashboard-context` — approved decisions and change control.
- `design-to-code` — presentational fidelity and component variants.
- `dotnet-api-integration` — DTOs, API services, and error handling.
- `arabic-english-rtl` — direction-aware components and copy.
- `dashboard-performance` — render and bundle consequences of architecture.
- `frontend-quality-security` — tests, typing, and review.
