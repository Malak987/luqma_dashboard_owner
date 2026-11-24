---
name: arabic-english-rtl
description: "Use when adding or reviewing Arabic and English interface text, RTL/LTR layout, language switching, direction-sensitive components, Arabic typography, mixed-direction content, or localized formatting in the Luqma dashboard. Enforces translation dictionaries, CSS logical properties, and complete bidirectional behavior without page reloads."
whenToUse: "Load before writing any user-visible text, layout, icon, table, form, navigation, dialog, or date/number format that must work in Arabic and English, and whenever language direction or localization is reviewed or tested. Do not load for backend-only or non-UI work."
---

# Arabic and English, RTL and LTR

## Mission

Make Arabic and English equal, first-class experiences throughout the Luqma dashboard. Direction is a layout concern, localization is a content concern, and both must be designed in from the first component rather than patched at the end.

## When to use this skill

Activate when:

- Adding or changing any user-visible string, label, message, placeholder, or empty state.
- Building layout, navigation, tables, forms, dialogs, menus, tooltips, or pagination.
- Adding an icon, illustration, chart, or animation with directional meaning.
- Implementing language switching, persistence, or initial locale detection.
- Formatting dates, times, numbers, currency, phone numbers, or addresses.
- Reviewing a screen in either language or direction.

Do not treat this skill as a translation-only pass. Direction and layout are part of the implementation.

## Non-negotiables

- No hardcoded interface text in components. Every user-visible string comes from a translation dictionary.
- Arabic and English must both be complete. A feature is not done if one language is missing, truncated, or visually broken.
- RTL and LTR must both be tested. Do not assume that `dir="rtl"` on the page is sufficient.
- Use CSS logical properties and direction-aware utilities; do not scatter physical `left`/`right` values.
- Do not change approved copy during translation. If a translation cannot fit or is ambiguous, ask the owner.
- Do not machine-translate and ship without review. The owner or a qualified reviewer approves Arabic copy.
- Do not use Arabic text as decoration or pseudo-localization in production.

## Localization architecture

Use one localization system with these properties:

- Dictionaries live under `src/i18n/` (or the repository's agreed location), with one file or namespace per language.
- Keys are stable, descriptive, and typed. A missing key must fail visibly in development and fall back safely in production.
- Components request keys, not inline strings: `t('orders.empty.title')`.
- Interpolation is explicit: `t('orders.count', { count })`, not string concatenation.
- Pluralization, gender, and number formatting go through the localization mechanism or `Intl`, not hand-written conditionals.
- Keys are grouped by feature or shared namespace; avoid one giant flat file with ambiguous names.
- Both dictionaries have the same key set. Add a parity check to tests or a lint step.
- Do not embed HTML in translations. Compose rich text from separate keys or React nodes.
- Do not translate API enum values or field names by mutating data; map them to display labels in the UI.
- If the API returns localized content, verify whether it uses `Accept-Language` or a locale field; do not translate server content again.

### Library decision gate

The mandatory stack does not include a specific i18n library. Choose deliberately:

- **Default: a lightweight typed dictionary plus the built-in `Intl` APIs.** This is enough for a modest key set, interpolation, number/date/currency formatting, and language switching without another dependency.
- **Use a library such as `react-i18next` only if approved**, and only when it earns its cost through pluralization, namespaces, lazy-loaded dictionaries, rich text, or a translation workflow the project actually needs.
- Whatever the choice, it must not force a full page reload to switch languages, and it must expose the current locale and direction to the layout.

Do not install either option during planning. Record the decision, the rationale, and the bundle cost before adding a dependency.

## Language switching

- Keep the active locale in a single source of truth available to the whole app.
- On change, update all three: the UI copy, `document.documentElement.lang`, and `document.documentElement.dir` (`rtl` for Arabic, `ltr` for English).
- Switch without a full page reload. React should re-render with the new dictionary and direction.
- Preserve the current route, filters, form values, scroll position where practical, and unsaved input.
- Persist the preference. Use `localStorage` for an anonymous preference; if the backend stores a user locale, reconcile it with the verified API behavior and document precedence.
- On first visit, use a stored preference first. Fall back to an owner-approved default, not an assumption that Arabic is always primary.
- A URL locale parameter or locale-prefixed route is optional; if used, keep it consistent with the stored preference and document the behavior.
- If server-fetched content is localized, invalidate or refetch the affected queries on language change; do not show stale English data under an Arabic interface.
- Update the document title and any metadata that depends on language.
- Announce the language change to assistive technology if the switch is not otherwise obvious.

## Direction fundamentals

Set direction at the document root (`<html dir="rtl" lang="ar">` or the React equivalent) and let it inherit. Avoid wrapping random subtrees in `dir` unless the content itself is mixed-direction.

Use CSS logical properties:

| Physical (avoid) | Logical (prefer) |
|---|---|
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| `border-left` / `border-right` | `border-inline-start` / `border-inline-end` |
| `left` / `right` (positioning) | `inset-inline-start` / `inset-inline-end` |
| `text-align: left` / `right` | `text-align: start` / `end` |
| `float: left` / `right` | `float: inline-start` / `inline-end` |
| `border-radius` corners | logical corner properties where supported |
| `width` on inline-axis elements | `inline-size` where it clarifies intent |

With Tailwind, prefer the logical utilities supported by the installed version:

- spacing: `ms-*`, `me-*`, `ps-*`, `pe-*`;
- positioning: `start-*`, `end-*`;
- text: `text-start`, `text-end`;
- borders: `border-s`, `border-e`, `rounded-s-*`, `rounded-e-*`;
- direction variants such as `rtl:` and `ltr:` only for genuine exceptions.

Verify the Tailwind version before relying on a utility. Do not mix a physical utility and its logical counterpart in the same rule.

Use direction-aware exceptions sparingly:

- transforms that must flip (for example a slide-in drawer) can use logical origins or a direction-aware variant;
- charts and canvases need an explicit decision about axis direction;
- third-party widgets that do not support RTL need a contained wrapper and a documented workaround;
- do not globally flip the entire app with `transform: scaleX(-1)`; it mirrors text and images incorrectly.

## Icons, graphics, and motion

- Mirror directional icons: back/forward arrows, chevrons, breadcrumb separators, "next/previous", send, indent, and directional progress indicators.
- Do not mirror: logos, brand marks, checkmarks, media play controls, clocks, numbers, maps, and any icon whose meaning is not tied to reading direction.
- Mirror illustrations only when the owner's design shows them mirrored or the direction is intrinsic.
- Keep icon and text spacing logical (`gap` works; margins must be inline-aware).
- Direction-aware animation should enter and exit from the correct side.
- Test icons at the same optical size in both languages; Arabic glyphs and Latin glyphs may need different alignment.

## Arabic typography

- Use the Arabic font specified by the approved design. If only a Latin font is supplied, request the Arabic brand font rather than substituting silently.
- Provide robust fallbacks for Arabic: system Arabic fonts and a well-supported web font if approved.
- Set an Arabic body line height that fits the script, typically taller than the Latin equivalent. Verify against the design rather than guessing.
- Do not apply letter-spacing or uppercase transforms to Arabic text.
- Do not use faux bold or faux italic. Use real weights supplied by the font; avoid italic for Arabic unless the design explicitly calls for it.
- Preserve Arabic punctuation, diacritics where required, and correct shaping. Do not insert Latin spaces inside Arabic words.
- Check numeral style. Use Western Arabic numerals or Arabic-Indic numerals according to the approved design and locale conventions; be consistent within a screen.
- Use `font-variant-numeric` or `Intl.NumberFormat` for tabular figures in tables where alignment matters.
- Test long Arabic strings, wrapped labels, and mixed Arabic/English brand names.

## Mixed-direction content

User-generated and data-driven content can contain Arabic, English, numbers, URLs, and emojis in one string. Handle it explicitly:

- Use `dir="auto"` on elements whose content direction is unknown.
- Wrap inline fragments that must keep their own direction in `<bdi>` or an element with `dir="ltr"`.
- Keep emails, phone numbers, URLs, order IDs, SKUs, and codes LTR, even inside Arabic sentences.
- Keep user names and addresses `dir="auto"` so the first strong character determines direction.
- Use `unicode-bidi: isolate` for inline widgets rather than inserting invisible control characters into strings.
- Do not reverse the characters of a mixed string manually.
- In tables, align the column by its semantic content, not by the first character of a particular row.
- In inputs, set `dir="auto"` for free-text fields such as names and addresses, and `dir="ltr"` for email, phone, URL, and code fields.
- Test a name that is English inside an Arabic UI and an Arabic name inside an English UI.

## Formatting

- Use `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat`, and `Intl.ListFormat` with the active locale, not hardcoded `en-US` formats.
- Decide and document the locale variant (`ar`, `ar-EG`, `ar-SA`, etc.) and the time zone. Do not silently use the browser time zone for business-critical times; verify what the API returns.
- Format currency from the API's currency code or the owner's specified currency, not from a guessed symbol.
- Respect the design's date order, 12/24-hour clock, and numeral style.
- Format phone numbers for display only; send the API's expected format.
- Use relative time only where the design calls for it, and ensure it updates or is refreshed appropriately.
- Do not assume Hijri dates. Use them only if the owner and design require them, and use a verified conversion approach.
- Keep stored/API values in their canonical format; localize only at the display boundary.

## Component checklist

### Navigation and shell

- Sidebar, top bar, and content order follow the approved design in both directions.
- The collapse control, menu affordances, and active indicators are direction-aware.
- Breadcrumb separators and "back" affordances mirror correctly.
- Skip links and focus order follow the visual and reading order in both directions.

### Tables and lists

- Text columns align to `start`; numeric columns follow the design and stay numerically comparable.
- Sticky columns use logical positioning.
- Horizontal scroll starts on the correct side and remains discoverable.
- Pagination labels, page numbers, and next/previous controls are localized and mirrored.
- Empty, loading, and error states are localized and direction-aware.
- Row action menus open on the correct side and stay within the viewport.

### Forms

- Labels, required markers, help text, and errors are localized.
- Error summaries and field errors are announced and associated with inputs.
- Text inputs use `dir="auto"` unless the field has a fixed direction.
- Email, phone, URL, number, and code inputs use `dir="ltr"` and appropriate `inputMode`.
- Placeholders are translated and do not carry essential instructions alone.
- Date and time pickers display in the active locale and direction.
- Validation messages do not concatenate translated fragments in an ungrammatical order.

### Dialogs, drawers, and menus

- Placement and animation respect direction.
- Close buttons remain reachable and conventionally placed; verify with the design.
- Focus is trapped and restored correctly.
- Long Arabic titles wrap without colliding with controls.

### Feedback

- Toasts, banners, confirmations, and empty states are localized.
- Icons with directional meaning mirror; status icons do not.
- Error text does not expose untranslated server messages.

### Charts and data visualization

- Decide and document axis direction, legend order, and tooltip alignment.
- Do not mirror a chart blindly if it changes the meaning of the data.
- Localize labels, numbers, dates, and units.

## Testing

- Verify dictionary key parity between Arabic and English.
- Run a missing-key check in development and a localized fallback in production.
- Test both locales on every in-scope screen, not a single smoke screen.
- Test both directions at desktop, tablet, and mobile widths.
- Check for horizontal overflow, clipped text, overlapping controls, and broken sticky elements.
- Test long Arabic strings, mixed-direction names, English brand names, numbers, emails, and URLs.
- Test language switching without reload and confirm the route and form values survive.
- Use Playwright or RTL tests to cover the language switch and at least one direction-sensitive component.
- Perform a visual comparison in both directions; automated snapshots are evidence, not approval.
- Check keyboard navigation and screen-reader announcements in both languages where feasible.

## Definition of done

- [ ] Every user-visible string comes from a dictionary; no hardcoded interface copy remains.
- [ ] Arabic and English dictionaries have the same keys.
- [ ] Language switching updates copy, `lang`, and `dir` without a page reload and persists the choice.
- [ ] Layout uses logical properties; no unintended physical `left`/`right` rules remain.
- [ ] Directional icons and animations are mirrored; non-directional assets are not.
- [ ] Arabic typography follows the approved font, weights, line height, and numeral style.
- [ ] Mixed-direction content is isolated correctly.
- [ ] Dates, numbers, currency, and phones are localized with `Intl` or the approved mechanism.
- [ ] Navigation, tables, forms, dialogs, menus, and feedback are verified in both directions.
- [ ] Tests cover key parity, language switching, and at least one representative RTL/LTR screen.

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

- `luqma-dashboard-context` — approved copy, locale decisions, and change control.
- `design-to-code` — preserving the approved visual design in both directions.
- `react-clean-architecture` — typed dictionaries and direction-aware components.
- `dotnet-api-integration` — localized API content and `Accept-Language`.
- `dashboard-performance` — font loading, bundle cost, and re-render behavior.
- `frontend-quality-security` — accessibility and localization tests.
