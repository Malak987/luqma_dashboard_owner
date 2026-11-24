---
name: dashboard-performance
description: "Use when optimizing Luqma dashboard load time, route-based code splitting, React render behavior, TanStack Query caching, server-side pagination, images and assets, or bundle size, and whenever a performance claim is made. Requires before-and-after measurement instead of unsupported speed claims."
whenToUse: "Load before performance work, when adding a route, data query, large component, image, font, or dependency, when users report slowness, or when writing a performance summary. Do not load to justify speculative optimization without a measured problem."
---

# Dashboard Performance

## Mission

Make the Luqma dashboard fast in measurable, user-visible ways without trading away correctness, design fidelity, accessibility, or maintainability. Measure first, change one cause at a time, and report evidence rather than adjectives.

## When to use this skill

Activate when:

- Initial load, navigation, or interaction feels slow or is reported as slow.
- Adding a route, a large feature, a heavy dependency, a chart, a table, or a data query.
- Implementing lazy loading, code splitting, prefetching, caching, pagination, or virtualization.
- Optimizing images, fonts, icons, CSS, or bundle size.
- Reviewing a change that claims to improve performance.
- Writing release notes or a report that mentions speed.

Do not optimize from intuition alone. If there is no baseline and no user-visible problem, first measure or leave the code alone.

## Non-negotiables

- Performance must be measured, never claimed (shared contract rule 8).
- Use a production build for measurements. Development-mode timings are not evidence.
- Record the route, device/network conditions, cache state, date, and method.
- Report before and after, including negative or neutral results.
- Do not add a dependency, a caching layer, or a complex optimization without owner approval and a measured reason.
- Do not sacrifice correctness, accessibility, RTL, or design fidelity for a benchmark.
- Do not "optimize" by removing required data, states, or features.

## Baseline first

Create a baseline for the routes in scope:

| Route | Device / network | LCP | INP | CLS | TTFB | JS transferred | Requests | Cache state | Date |
|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  | cold / warm |  |

Measure with the tools available in the project and browser:

- Chrome DevTools Performance and Lighthouse, or an approved equivalent.
- React DevTools Profiler for render behavior.
- The production build's chunk output for bundle size.
- A bundle analyzer only if the owner approves the tooling.
- Real-user Web Vitals only if the project has an approved, privacy-respecting analytics setup. Do not add analytics as part of performance work without approval.

Use the standard Web Vitals "good" thresholds as reference, not as a guarantee:

- LCP at or below 2.5 s at the 75th percentile.
- INP at or below 200 ms at the 75th percentile.
- CLS at or below 0.1 at the 75th percentile.

Agree route-level budgets with the owner. A budget is a project decision, not a universal constant. Record the agreed numbers and the route they apply to.

## Initial load

- Keep the application shell, authentication bootstrap, locale bootstrap, and critical layout eager.
- Defer features that are not needed for the first meaningful screen.
- Do not block the first render on non-critical requests. Fetch independent data in parallel where the API allows.
- Avoid a chain of "fetch A, then B, then C" when B and C do not depend on A's result.
- Use skeletons or placeholders that match the final layout to avoid layout shift.
- Load fonts and critical images deliberately; see the asset section.
- Avoid shipping large, unused libraries in the entry chunk.

## Lazy loading and route-based code splitting

- Split by route first. Each top-level route should load its screen code on demand.
- Use `React.lazy` with `Suspense` and an error boundary that fits the approved loading and error designs.
- Keep shared shell and design-system code in a common chunk so routes do not duplicate it.
- Split heavy, route-specific features: charts, rich editors, large tables, maps, and report builders.
- Do not lazy-load every small component. Excessive splitting creates request waterfalls, layout flashes, and worse perceived performance.
- Prefetch a route on user intent (hover, focus, link visibility) only when the prefetch is cheap and likely to be used.
- Avoid prefetching sensitive or expensive data the user may never open.
- Verify the generated chunks after `vite build`; check that the entry chunk shrank and that no route accidentally imports the entire feature graph.
- Watch for barrel files and top-level side effects that defeat tree shaking.

## React render performance

Profile before changing code:

- Use React DevTools Profiler to identify which components actually re-render and why.
- Fix unnecessary state placement before adding `memo`.
- Keep state as close as possible to where it is used.
- Derive values during render instead of storing and synchronizing derived state.
- Split large contexts so consumers do not re-render on unrelated changes.
- Use stable, unique keys. Do not use array indexes for reorderable lists.
- Pass stable references to memoized children when it makes a measured difference; avoid `useCallback` and `memo` everywhere by default.
- Use Zustand selectors that return only the needed slice; avoid selecting the whole store.
- Use `startTransition` or `useDeferredValue` for non-urgent filtering or typing work when supported by the React version.
- Virtualize very long lists or tables only when row count and measurement justify it; virtualization is an approved dependency/design decision.
- Move expensive pure computation out of render or memoize it with a measured reason.
- Avoid layout thrashing: do not read layout and then write styles repeatedly in loops.

Report the number of renders before and after, or the interaction time, not just "it feels faster".

## TanStack Query caching

Use server state in TanStack Query; do not duplicate it into Zustand or component state.

- Define a query-key factory per feature. Keys must be stable, serializable, and include every parameter that changes the result.
- Set `staleTime` per data type according to how often the data actually changes and what the owner considers acceptable freshness. Document the choice.
- Set `gcTime` deliberately; do not retain large caches forever by accident.
- Use `enabled` for queries that depend on authentication, a selected ID, or a user action.
- Use `placeholderData`/`keepPreviousData` for pagination so the table does not blank between pages.
- Prefetch the next page or a likely detail view only when it is cheap and useful.
- Deduplicate requests by sharing query keys; do not create a new key per component instance.
- Invalidate precisely after mutations. Do not invalidate the entire cache unless the change truly affects everything.
- Avoid automatic refetch storms. Configure focus/reconnect refetch per query and per app needs.
- Do not poll unless the backend and product require it. Prefer explicit refresh or a documented real-time mechanism.
- Cancel or ignore superseded requests when filters change quickly.
- Keep query functions pure and free of UI side effects.
- If the app uses route loaders to prefetch, integrate them with the same QueryClient and keys; do not create a second cache.

## Server-side pagination, filtering, and sorting

- Use server-side behavior whenever the API supports it. Verify parameter names, defaults, limits, and response metadata in the contract.
- Do not download an entire dataset to paginate, filter, or sort in the browser unless the owner approves and the dataset is verified small.
- Keep pagination, sort, filters, and search in the URL when they should survive refresh or sharing.
- Debounce search input, cancel stale requests, and render the latest result only.
- Respect the maximum page size.
- Fetch counts only if the API provides them efficiently; avoid a second full scan for a badge.
- For dashboards with several independent cards, fetch in parallel and let each card own its loading/error state rather than blocking the whole page.

## Images, fonts, and assets

Images:

- Serve modern formats (WebP/AVIF) with fallbacks where the asset pipeline supports them.
- Provide width and height or an aspect ratio to prevent layout shift.
- Use responsive `srcset`/`sizes` for content images.
- Lazy-load images below the fold; load the LCP image eagerly with high priority.
- Compress assets before committing; do not commit oversized originals if the build does not process them.
- Avoid base64-encoding large images into JavaScript or CSS.
- Use SVG for icons and simple illustrations; avoid raster icons at multiple sizes.

Fonts:

- Subset fonts to the scripts actually used, including Arabic if the font supports it.
- Preload only the critical font files.
- Use `font-display: swap` or the approved loading strategy.
- Self-host or use an approved provider consistent with privacy and security requirements.
- Avoid loading multiple weights that are never used.
- Verify Arabic and Latin fallback metrics to reduce layout shift.

Icons and CSS:

- Import only the icons used; do not ship an entire icon package.
- Use an SVG sprite or inline SVG where appropriate.
- Keep Tailwind content paths accurate so unused classes are removed.
- Avoid large global CSS resets or component libraries that duplicate the design system.

## Network and infrastructure

- Enable compression and HTTP caching at the server or CDN where the deployment supports it. Frontend code alone cannot guarantee these; document the requirement and coordinate with the owner.
- Respect API cache headers and ETags if documented; do not invent client caching that contradicts the contract.
- Avoid duplicate requests for the same resource on one screen.
- Keep request payloads small; do not send unchanged fields in updates unless the API requires full replacement.
- Use the API's pagination and filtering rather than broad queries followed by client filtering.
- Measure cold and warm cache states separately.

## Dependencies and bundle size

- Every dependency has a cost. Evaluate purpose, bundle size, tree-shakeability, maintenance, license, and security before proposing one.
- Prefer platform APIs and existing project utilities.
- Import only the functions used from utility libraries.
- Avoid multiple libraries that solve the same problem (dates, HTTP, forms, state).
- Do not add a large UI kit to reproduce a design that a small set of primitives can cover.
- Check the production build output after adding or removing a dependency.
- A bundle analyzer is useful but is a tooling dependency; request approval before adding it.
- Keep the lockfile change reviewable; do not silently update unrelated packages.

## Measurement workflow

1. Define the route and user interaction to improve.
2. Capture a baseline on a production build under stated conditions.
3. Identify the largest measured contributor.
4. Make one change at a time.
5. Rebuild and remeasure under the same conditions.
6. Record the delta and any tradeoff.
7. Repeat or stop when the budget is met or the remaining work is not worth the complexity.
8. Report the method and the numbers, including what did not improve.

Example report:

```text
Route: /orders
Build: production, commit <sha>
Device/network: desktop, Fast 4G, cold cache
Before: LCP 3.8 s, INP 240 ms, CLS 0.14, entry JS 412 KB
Change: route-level split for order details; removed unused icon import
After: LCP 2.6 s, INP 190 ms, CLS 0.04, entry JS 268 KB
Method: Lighthouse 3 runs, median; DevTools performance trace
Remaining: table still loads all rows when filters change; see follow-up
```

Do not claim "significantly faster", "optimized", or "blazing fast" without a report like this.

## Anti-patterns

- Optimizing in development mode and reporting the result.
- Adding `memo`, `useMemo`, and `useCallback` everywhere without profiling.
- Lazy-loading every component and creating a request waterfall.
- Fetching the same data in a component and in a layout with different query keys.
- Copying query data into Zustand.
- Client-side pagination of a full dataset.
- Polling every few seconds because it is easy.
- Importing an entire icon or utility library for one function.
- Shipping unoptimized hero images.
- Loading all font weights and scripts.
- Blocking the first paint on non-critical API calls.
- Hiding a slow request behind a permanent skeleton instead of fixing it.
- Claiming performance improvements without before-and-after evidence.
- Sacrificing loading/error/empty states for a smaller bundle.

## Definition of done

- [ ] A baseline and a target were recorded for the in-scope routes.
- [ ] The production build was measured before and after.
- [ ] The improvement or neutral result is reported with method and numbers.
- [ ] Initial load and route transitions were checked for waterfalls and layout shift.
- [ ] Query caching is deliberate, deduplicated, and documented.
- [ ] Pagination and filtering are server-side where the API supports them.
- [ ] Images and fonts are appropriately sized, formatted, and loaded.
- [ ] Bundle size was checked and no unapproved dependency was added.
- [ ] Correctness, design fidelity, RTL, and accessibility were rechecked after optimization.

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

- `luqma-dashboard-context` — approval gates and performance budgets.
- `react-clean-architecture` — state ownership, hooks, and component boundaries.
- `dotnet-api-integration` — pagination, query parameters, and request volume.
- `design-to-code` — loading and skeleton states that avoid layout shift.
- `arabic-english-rtl` — fonts, text expansion, and direction-aware rendering.
- `frontend-quality-security` — tests and production build review.
