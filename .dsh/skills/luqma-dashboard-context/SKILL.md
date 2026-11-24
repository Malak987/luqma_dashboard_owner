---
name: luqma-dashboard-context
description: "Use at the start of any Luqma Web Dashboard task and whenever a decision spans features, changes architecture or dependencies, or depends on an unverified API or business rule. Establishes the project's sources of truth, approval gates, decision log, and consistency rules; it does not authorize implementation."
whenToUse: "Load first for Luqma dashboard onboarding, architecture or dependency decisions, cross-feature conventions, API or business-rule questions, and whenever two project sources disagree. Do not load for a self-contained visual, test, or refactor task already governed by approved decisions in this session."
---

# Luqma Dashboard Context

## Mission

Keep every Luqma Web Dashboard change aligned with the real Luqma ecosystem: the approved designs, the existing ASP.NET Core API, the backend's business rules, and the decisions the project owner has explicitly approved.

This skill is the project's memory and governance layer. It does not implement screens, call endpoints, or choose libraries on its own. It makes the constraints visible before work starts and routes decisions to the owner when the evidence is incomplete.

## When to use this skill

Activate when any of these is true:

- A new Luqma dashboard session, feature, or workstream starts.
- Work crosses more than one feature, route, or layer.
- A technology, dependency, folder-structure, state-management, routing, authentication, i18n, or caching decision is proposed.
- A screenshot, Swagger/OpenAPI document, Postman collection, existing code, or owner statement appears to disagree with another source.
- A task depends on an endpoint, field, status code, enum, permission, or business rule that is not yet verified.
- A change could alter pricing, fees, availability, order lifecycle, roles, notifications, or any other established business behavior.
- A shortcut would "clean up", simplify, or redesign an approved screen.

Do not use this skill as a substitute for the task-specific skills. Load it alongside `design-to-code`, `dotnet-api-integration`, `react-clean-architecture`, `arabic-english-rtl`, `dashboard-performance`, or `frontend-quality-security` when their concerns apply.

## Source-of-truth hierarchy

Use this order. A lower source never silently overrides a higher one.

1. **Owner-approved UI screenshots and design assets** for presentation: layout, spacing, color, typography, iconography, copy, and visible states.
2. **The existing ASP.NET Core API contract** for data and behavior: Swagger/OpenAPI plus the Postman collection, analyzed together. Neither source is automatically authoritative when they disagree.
3. **Explicit owner decisions** recorded in the project decision log for anything the first two sources do not settle.
4. **Existing project code and tests** for conventions already in use, unless they conflict with 1-3.
5. **Nothing else.** Blog posts, assumptions about ASP.NET Core defaults, memory of similar projects, and "common practice" are not project facts.

The visual source of truth governs appearance. The API contract governs what data and actions actually exist. If a design requires data or behavior the API does not expose, stop and ask the owner; do not invent an endpoint, field, or client-side workaround that changes the rules.

## Shared project contract

These rules apply to every Luqma dashboard skill and cannot be overridden by a task-specific preference:

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

## Known, unknown, and blocked

Label important statements before acting on them:

- **Verified** — directly supported by an approved design, the reconciled API contract, an owner decision, or existing code/tests.
- **Unverified** — plausible but not yet confirmed. Do not ship code that depends on it.
- **Blocked** — cannot proceed safely until the owner clarifies. State exactly what is missing.

Never convert an assumption into a requirement by repeating it in code, types, tests, or documentation. A guessed field name or status transition becomes a defect that is expensive to remove.

When the API is silent about a behavior, ask a precise question: which endpoint, which field, which response, which permission, and what the UI should do in each outcome. If the owner cannot answer immediately, mark the work blocked or implement only the verified part behind a clearly reviewed seam.

## Ecosystem understanding

- Luqma is an existing food ordering ecosystem, not a greenfield product.
- The dashboard is a new frontend that consumes an already available and tested REST API.
- The API is documented through Swagger/OpenAPI and exercised through Postman collections.
- The existing Flutter application and the .NET backend are out of scope for modification. They may be read for context only when the owner explicitly allows it.
- The dashboard must match the owner's existing designs rather than introduce a new visual language.
- The dashboard is used in Arabic and English; both directions are first-class, not an afterthought.

Do not infer Luqma-specific business rules from the food-ordering domain. For example, the existence of delivery fees, taxes, promo codes, order-state transitions, branch availability, or role hierarchies may be true, but each must be verified in the contract, existing behavior, or an owner statement before it is encoded.

## Preserve backend business rules

The frontend must not become a second, conflicting source of truth. Treat these categories as protected until verified:

- prices, discounts, promotions, taxes, service fees, delivery fees, and rounding;
- item availability, branch/menu availability, stock, and scheduling;
- order, payment, refund, and cancellation state transitions;
- who may view or perform an action (roles, permissions, ownership, tenancy);
- validation rules that affect what the backend accepts;
- notification, audit, and history behavior;
- any computed total, count, or eligibility decision.

Rules for frontend work:

- Display server-calculated values; do not recalculate money or eligibility for display unless the owner confirms the exact formula and rounding.
- Do not hide, relax, or reimplement a backend rule because a UI flow is awkward.
- Do not "fix" a business rule in the frontend. Report the discrepancy and request a decision.
- If a rule must be represented client-side for UX (for example, disabling a button), treat it as a hint and still handle the authoritative server response.
- When an existing rule changes, update the decision log and affected tests openly; never change it as a side effect of a feature.

## Consistency across features

Use shared, named conventions rather than per-feature improvisation:

- **Design tokens** for color, spacing, typography, radius, shadow, and breakpoints. Tokens come from the approved designs.
- **Shared primitives** for buttons, inputs, selects, tables, dialogs, badges, empty states, and feedback.
- **One HTTP layer** with one base URL, one auth mechanism, one error-normalization strategy, and one way to cancel requests.
- **One query-key factory** per feature and a documented caching policy.
- **One i18n system** with typed translation keys and no hardcoded interface copy.
- **One routing and permission pattern** for guarded screens.
- **One date, number, currency, and phone formatting approach** driven by the active locale.
- **One testing pattern** per layer.

If an existing feature uses a different pattern, do not fork a second pattern silently. Either follow the established convention or propose a migration with an approval request.

## Approval gates

Obtain explicit owner approval before any of the following. Silence, a previous approval for a different change, or an agent's recommendation is not approval.

- Adding, removing, or replacing a runtime dependency or a major tool.
- Changing the proposed folder architecture, layer boundaries, or cross-feature import rules.
- Changing the API base URL, authentication scheme, token storage, refresh behavior, or session lifetime.
- Choosing a router mode, state-management approach, i18n library, form library, or styling strategy not already approved.
- Resolving a Swagger/Postman discrepancy by picking one source.
- Deviating from an approved screen, inventing a missing state, or changing user-visible copy.
- Changing a business rule, permission rule, validation rule, or order-flow behavior.
- A new backend or database is out of scope and cannot be approved within this project. A development proxy or mock server requires explicit owner approval and must not become the contract. Production data access is not part of this project; do not read or write it.
- Adding analytics, error tracking, feature flags, or third-party scripts that can receive user data.
- Any change that could expose secrets, personal data, or customer information.

Use this approval request format:

```text
Proposed decision:
Problem it solves:
Options considered (with tradeoffs):
Affected screens, files, API calls, and users:
Risk and rollback:
Validation plan:
Explicit approval requested from:
```

## Decision log

Record approved decisions so later work does not relitigate them. A proposed location is `docs/decisions/luqma-dashboard.md`, pending owner approval; do not create project documentation outside the skill pack until implementation is authorized.

Each entry should include:

```text
ID: DEC-0001
Date:
Status: proposed | approved | superseded
Decision:
Context and problem:
Alternatives and tradeoffs:
Consequences and follow-up work:
Owner approval reference:
Supersedes / superseded by:
```

At minimum, record decisions about the stack and versions, folder architecture, HTTP client and error model, auth and token storage, routing, server-state and client-state ownership, i18n approach, design-token source, responsive breakpoints, testing strategy, and any API discrepancy resolution.

## Conflict resolution

- **Design vs API:** the design governs appearance; the API governs available data and actions. If they are incompatible, the owner decides whether to change the design, defer the feature, or change the backend (a separate project).
- **Swagger vs Postman:** do not choose silently. Record the discrepancy, test against an approved environment if permitted, and ask the owner to confirm the contract.
- **Existing code vs approved design/contract:** new work follows the approved sources. Do not refactor unrelated code to make it fit; propose the refactor separately.
- **Skill vs skill:** this skill owns project-wide rules, sources of truth, and approval gates. The task-specific skill owns its engineering practice. If they appear to conflict, the shared project contract above wins and the conflict must be reported.
- **Owner instruction vs documented rule:** ask the owner to confirm that the rule is intentionally changing, then update the decision log and tests. Never modify the rule silently.

## Start-of-task checklist

Before writing code for a Luqma dashboard task:

- [ ] I know which screens or flows are in scope and where their approved screenshots are.
- [ ] I have the current Swagger/OpenAPI document and Postman collection, or I know they are unavailable.
- [ ] I have listed every endpoint, field, permission, and business rule the task depends on.
- [ ] I have marked each as Verified, Unverified, or Blocked.
- [ ] I know which decisions are already approved and which need approval.
- [ ] I know the Arabic and English requirements and the RTL/LTR impact.
- [ ] I know how the change will be measured and tested.
- [ ] I have not installed dependencies, modified the backend, or touched the database.

## Related skills

| Concern | Skill |
|---|---|
| Faithful implementation from screenshots | `design-to-code` |
| Layer boundaries and typed React code | `react-clean-architecture` |
| Swagger/Postman reconciliation and API services | `dotnet-api-integration` |
| Arabic, English, RTL, and LTR | `arabic-english-rtl` |
| Measured performance | `dashboard-performance` |
| Testing, accessibility, security, build and diff review | `frontend-quality-security` |
