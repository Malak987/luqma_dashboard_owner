# Luqma Dashboard Engineering Skill Pack

**Status:** Proposed — awaiting explicit owner approval.
**Scope of this task:** Engineering guidance only. No dashboard implementation, app initialization, dependency installation, backend change, database change, migration, branch creation, commit, or push was performed.

## Location and discovery

- Pack root: `.dsh/skills/`
- Official DeepSeek Harness project discovery path: `<projectRoot>/.dsh/skills/<kebab-case-name>/SKILL.md` (local provider rank 100, `project-dsh`).
- The project root is the nearest ancestor containing `.git`. If there is no `.git`, the current working directory is used. This workspace has no `.git`, so the workspace itself is the project root for discovery.
- If the actual Luqma repository is rooted elsewhere, the pack belongs at that repository's `.dsh/skills/` path. Confirm the location with the owner before moving or copying anything.
- Flat `<name>.md` skills are also supported by Harness, but this pack uses directory bundles so each skill can grow references or scripts later.
- All seven skills were observed by the running Harness session catalog after creation.

## Skills and activation

| Skill | Primary responsibility | Activate when |
|---|---|---|
| `luqma-dashboard-context` | Sources of truth, ecosystem constraints, business-rule preservation, consistency, approval gates, decision log | Starting any dashboard task, making a cross-feature or architectural decision, or facing an unverified API/business rule |
| `design-to-code` | Faithful screenshot analysis, tokens, responsive layout, component behavior, missing states, visual QA | Implementing or reviewing a screen from owner-supplied designs |
| `react-clean-architecture` | Feature-based presentation/domain/data boundaries, typed services, hooks, state ownership, overengineering guardrails | Creating a feature, placing logic, or reviewing React/TypeScript structure |
| `dotnet-api-integration` | Swagger/Postman reconciliation, endpoint and DTO inventory, typed API services, auth, errors, pagination | Reading or writing Luqma API data, or implementing auth and error states |
| `arabic-english-rtl` | Translation dictionaries, language switching, RTL/LTR, logical CSS, Arabic typography, mixed direction, `Intl` formatting | Adding user-visible text, direction-sensitive UI, localization, or language switching |
| `dashboard-performance` | Initial load, route splitting, render profiling, TanStack Query caching, server-side paging, assets, bundle size, measurement | Optimizing or reviewing performance, or making any performance claim |
| `frontend-quality-security` | Tests, TypeScript strictness, accessibility, tokens/sessions, secrets, authorization, input safety, build and diff review | Touching auth, forms, tests, a11y, release readiness, dependencies, or a pull request |

Load `luqma-dashboard-context` first in a new workstream, then the task-specific skills. Several skills may apply to one change; none overrides the shared contract below.

## Proposed frontend stack

This is the proposed lightweight direction for owner approval. No version has been pinned and nothing has been installed.

| Technology | Purpose | Decision notes |
|---|---|---|
| React | Component UI and rendering | Use function components and hooks; current stable version to be pinned at initialization |
| TypeScript | Type safety across UI, domain, and API boundaries | `strict` mode; no `any`; DTOs at the transport boundary |
| Vite | Development server and production build | Route-level splitting; production build is the performance reference |
| Tailwind CSS | Utility-first styling and design tokens | Map approved design values to named tokens; use logical utilities for RTL |
| TanStack Query | Server-state fetching, caching, deduplication, mutations | One source of truth for server data; no copying into Zustand |
| Zustand | Shared client state only | Use only when state is genuinely shared across routes/components; no server-state duplication |
| React Router | Routing, route params, lazy route boundaries | Route-based code splitting; guarded routes; URL-owned shareable filters |
| Axios | HTTP client and interceptors | Or an equivalent lightweight client if approved; one configured instance, no HTTP in components |
| React Hook Form | Form state and submission | Use when forms are non-trivial; simple controlled forms may not need it |
| Zod | Client-side schemas and boundary validation | Use where it adds real safety; server validation remains authoritative |
| Vitest + React Testing Library | Unit and component tests | Behavior-focused; mock at the HTTP/repository boundary |
| Playwright | Important end-to-end workflows | Critical flows, both locales, at least one RTL journey |
| Typed i18n dictionaries + `Intl` | Arabic/English copy, number/date/currency formatting | Default no-extra-dependency option; a library such as `react-i18next` requires owner approval and a stated purpose |
| Design-matched SVG icons | Visual fidelity | No full icon package unless the design and owner approve it |

Dependency rule: every addition beyond this list must state its purpose, bundle/maintenance cost, and alternative, and must receive explicit owner approval before installation. During this task no dependency was installed.

Not included by default: a component library, a CSS-in-JS library, a global state framework beyond Zustand, a charting library, an analytics SDK, an error-tracking SDK, a mock server, or a generated API client. Each would need a documented reason and approval.

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

`luqma-dashboard-context` owns these rules. The other six skills repeat them so each remains self-contained, and none may relax them.

## Approval gates

Explicit owner approval is required before:

- adding or replacing a dependency or major tool;
- changing the proposed folder architecture or layer boundaries;
- changing the API base URL, authentication scheme, token storage, refresh, or session lifetime;
- resolving a Swagger/Postman discrepancy by choosing one source;
- deviating from an approved screen or inventing a missing UI state;
- changing a business rule, permission, validation rule, or order flow;
- adding analytics, error tracking, feature flags, or third-party scripts that can receive user data;
- any action that could expose secrets, personal data, or customer information.

Silence is not approval. A new backend or database is out of scope and is not an approvable option within this project.

## Validation performed

- Seven and only seven skill bundles exist under `.dsh/skills/`.
- Each `SKILL.md` has a valid YAML frontmatter block parsed by the same `yaml` package the Harness filesystem provider uses, and independently by Python PyYAML.
- Every `name` is unique, kebab-case, and matches its directory name.
- Every `description` and `whenToUse` is present and non-empty; descriptions are 297–340 characters, within the Harness catalog description limit.
- Every skill has an explicit activation section and a "do not use" boundary.
- All twelve shared rules appear in every skill in identical wording.
- Cross-skill references use the exact skill names in this pack.
- The running Harness catalog lists all seven skills, confirming the official discovery path.
- The workspace was empty at the start. Only files under `.dsh/` were created; no other project file exists to be changed. No pre-existing skill was found, so none was overwritten or preserved.

## Missing project context

The following were not present in this workspace and are needed before implementation:

- The Luqma dashboard source tree, `package.json`, lockfile, and existing conventions.
- The approved UI screenshots/design files and brand assets, including Arabic and Latin fonts, icon set, and imagery.
- The Swagger/OpenAPI document and Postman collection, plus the target environment and API base URL.
- Authentication details: scheme, login/refresh/logout endpoints, token response fields, cookie/CORS behavior, session lifetime, roles, and permissions.
- Confirmed dashboard scope, routes, roles, and the exact Arabic/English key flows.
- Design decisions for missing states, responsive breakpoints, default locale, locale variant, time zone, currency, and numeral style.
- Owner decisions on architecture, i18n approach, token storage, caching policy, and tooling.
- A Git repository and branch state for controlled diff review.

## Recommended next step

1. Owner reviews and explicitly approves this skill pack.
2. Owner supplies the missing context above, especially screenshots, Swagger/OpenAPI, Postman collection, and the target environment.
3. Hold an architecture/decision session: confirm the stack and versions, folder structure, API contract, auth model, i18n approach, responsive breakpoints, and test strategy. Record the decisions.
4. Only after approval, initialize the React/Vite/TypeScript application and install approved dependencies.
5. Build a thin vertical slice first (application shell, session handling, one representative screen, both languages, loading/empty/error states, tests, and a performance baseline), then expand feature by feature.

**Do not begin dashboard implementation until the owner explicitly approves this pack.**
