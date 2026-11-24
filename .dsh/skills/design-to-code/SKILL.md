---
name: design-to-code
description: "Use when implementing or reviewing any Luqma dashboard screen, component, or responsive behavior from owner-supplied UI screenshots. Extracts layout, spacing, color, typography, icons, and states faithfully, prevents unapproved redesigns, and requires clarification for states the screenshots do not show."
whenToUse: "Load before writing UI for a new or changed Luqma screen, when comparing an implementation to a screenshot, when adapting a desktop design to tablet or mobile, or when a visible state is missing from the supplied images. Do not load to invent a new visual direction or to redesign an approved screen."
---

# Design to Code

## Mission

Reproduce the owner's approved Luqma dashboard designs as accurately as the screenshots allow, in React and Tailwind, across desktop, tablet, mobile, LTR, and RTL. The design is the specification. Implementation choices serve it; they do not revise it.

## When to use this skill

Activate when:

- Implementing a new screen or a visible change from a screenshot or design asset.
- Building or revising a shared visual component used by approved screens.
- Making a layout responsive across desktop, tablet, and mobile.
- Reviewing a pull request for visual accuracy.
- A design is ambiguous, incomplete, or missing a state, and a decision is needed before code.

Do not use this skill to propose a new brand, "modernize" a screen, or choose a different component library. Those are separate owner decisions.

## Non-negotiables

- Approved screenshots are the visual source of truth.
- Never redesign, simplify, reorder, hide, or "improve" an approved screen without explicit owner approval.
- Do not change copy, labels, field order, column order, icons, colors, spacing, or hierarchy because another approach seems cleaner.
- Do not invent behavior that the screenshot does not show. When a state is not visible, propose an interpretation and request approval.
- Do not substitute a font, icon set, or image because the specified asset is inconvenient.
- A responsive adaptation is allowed to change layout mechanics, not visual identity or information priority. If the design does not specify a breakpoint, document the proposed adaptation and get approval.
- If accessibility requires a visual or interaction change, do not make it silently; explain the conflict and propose the smallest compliant change.

## Screenshot intake

Before styling anything, build a screen inventory:

| Item | What to capture |
|---|---|
| Screen name and route | The name used by the owner and the planned route, if known |
| Screenshot files | Exact filenames and which flow step each represents |
| Viewport | Desktop, tablet, or mobile; approximate pixel width if visible |
| State | Default, loading, empty, error, success, modal, drawer, menu open, selected, disabled, etc. |
| Locale and direction | English/LTR, Arabic/RTL, or both |
| Theme | Light, dark, or both |
| Dependencies | Other screens needed to reach this state |
| Ambiguities | Anything cropped, blurred, hidden, or inconsistent between images |

If the same screen appears in several images with differences, ask which is current before coding. Do not average them.

## Extraction checklist

Extract evidence, not impressions. Record values in a screen spec before implementing.

### Layout

- Overall page frame: sidebar, top bar, content container, footer, safe areas.
- Content width, max-width, gutters, column grid, gaps, alignment, and sticky regions.
- Card and panel structure, nesting, dividers, and elevation.
- Scroll ownership: page, panel, table body, or modal.
- Z-order for overlays, dropdowns, tooltips, and drawers.
- Which regions are fixed, fluid, or collapsible.

### Spacing

- Derive the spacing scale from repeated measurements (commonly a 4 px or 8 px base; confirm rather than assume).
- Measure padding inside controls, cards, sections, and page containers.
- Measure gaps between repeated elements and between sections.
- Note optical adjustments separately from the scale.
- Do not replace measured spacing with a familiar utility value because it looks close.

### Color

- Sample exact values from the images; account for compression and color profiles where possible.
- Capture page background, surface, elevated surface, border, divider, text primary/secondary/muted, brand, accent, success, warning, danger, info, focus ring, disabled, overlay, and chart colors actually present.
- Capture gradients and opacity values explicitly.
- Map values to named design tokens; do not scatter arbitrary hex values through components.
- Check contrast for text and controls. If the approved design fails accessibility, report it and request a decision instead of silently changing colors.

### Typography

- Font families for Latin and Arabic, including fallbacks.
- Sizes, weights, line heights, letter spacing, and paragraph spacing for each text role.
- Heading hierarchy and truncation behavior.
- Numeric styles, tabular figures, and currency formatting.
- Do not substitute a similar font. If the specified font is unavailable or unlicensed, ask the owner.
- Do not apply letter-spacing to Arabic text.

### Icons and imagery

- Icon family, stroke or fill style, stroke width, corner style, and optical size.
- Which icons mirror in RTL and which must not (logos, checkmarks, media controls, clocks).
- Illustration and photo style, aspect ratios, cropping, border radius, and overlay treatment.
- Placeholder and fallback behavior for missing images.

### Components and behavior

- Identify every reusable primitive: button, input, select, checkbox, radio, toggle, tabs, badge, chip, tooltip, menu, table, pagination, modal, drawer, toast, empty state.
- Capture variants and sizes actually shown.
- Capture interactive states: default, hover, focus-visible, active, selected, disabled, loading, invalid.
- Capture transitions only if visible or specified; do not add decorative motion.
- Note keyboard behavior implied by the component type, and flag behavior that cannot be inferred.

### Content and formatting

- Exact interface copy in both languages where supplied.
- Date, time, number, currency, phone, and address formats.
- Truncation, wrapping, and overflow rules for long names and translated strings.
- Whether user-generated content may be bidirectional.

## Implementation workflow

1. **Inventory and clarify.** Complete the intake table. Ask about missing screenshots, states, viewports, locales, and assets before building around guesses.
2. **Write a screen spec.** Record layout, tokens, components, states, responsive behavior, and open questions. Keep it with the feature work.
3. **Establish tokens first.** Add or reuse the approved color, spacing, typography, radius, shadow, and breakpoint tokens. Do not start with screen-specific magic values.
4. **Build primitives.** Implement or reuse shared controls with all visible variants and states. Keep them presentational and accessible.
5. **Compose the static screen.** Match structure and spacing at the primary reference viewport before adding data or interactions.
6. **Integrate real states.** Connect loading, success, empty, error, unauthorized, and partial-data states through the feature's hooks. Do not let a component fetch directly.
7. **Add responsive behavior.** Verify desktop, tablet, and mobile at the agreed breakpoints. Check overflow, sticky elements, tables, dialogs, and navigation.
8. **Add RTL.** Verify the screen in Arabic and English. Use logical properties and direction-aware icons. Do not treat RTL as a post-launch fix.
9. **Visual QA.** Compare side by side at matching viewport sizes. Check spacing, typography, color, icon geometry, alignment, and state coverage. Record any intentional differences.
10. **Request review.** Present the screen, the reference images, the spec, and the list of approved deviations.

## Responsive requirements

Support desktop, tablet, and mobile. All three are required for every in-scope screen.

- Use the breakpoints evidenced by the designs. If the designs only show desktop, propose a breakpoint set and adaptation plan for approval before shipping mobile.
- Decide per region how navigation collapses, tables reflow or scroll, filters move into drawers, dialogs become full-screen sheets, and multi-column forms stack.
- Preserve information priority and actions. Do not remove fields or actions on mobile without approval.
- Test long Arabic and English text, zoom at 200%, and narrow widths.
- Ensure touch targets are usable and focus order remains logical.
- Avoid horizontal page scroll. Intentional table scroll must be contained and discoverable.
- Do not hide critical content behind hover-only interactions on touch devices.

## Missing states

Screenshots usually show the happy path. These states are commonly missing and must be resolved with the owner when the design does not show them:

- initial loading, background refresh, and skeleton/placeholder treatment;
- empty because there is no data yet versus empty because filters returned nothing;
- recoverable error, permission denied, session expired, and offline;
- validation errors, server field errors, and submit-in-progress;
- success confirmation, undo, and destructive confirmation;
- very long names, large counts, missing optional fields, and broken images;
- pagination boundaries, first/last page, and page-size changes;
- RTL layout, mixed-direction content, and Arabic text expansion.

For each missing state, propose the smallest treatment consistent with the approved design system, label it as a proposal, and request approval. Do not silently invent a new pattern, and do not omit the state because it is not pictured.

## Reusable components

- Put generic, design-system primitives in the shared UI layer; keep feature-specific compositions inside their feature.
- Reuse an existing component when it matches; extend it with explicit variants when the design requires a new form.
- Do not force one component to serve unrelated designs through a pile of boolean props. Split when the mental model differs.
- Do not abstract on first use. Wait for a second or third real use, then extract with a clear API.
- Keep components presentational: props in, markup and events out. Data fetching, permission decisions, and business rules belong in hooks or services.
- Document variants, sizes, states, and accessibility behavior.
- Every shared component must work in both directions and both languages before it is considered done.

## Visual QA

- Compare at the same viewport width and device scale factor as the reference.
- Use a side-by-side view or overlay/difference tool when available; do not rely on memory.
- Check the spacing rhythm, baselines, text wrapping, icon alignment, border radii, shadows, and color values.
- Check all interactive states, not just the default.
- Check both locales and both directions.
- If automated visual regression tests are added, treat them as a tool that needs owner approval and maintenance, not as proof of design approval.
- Never claim "pixel-perfect" unless an actual overlay comparison supports it. Say what was compared and what remains different.

## Screen spec template

```text
Screen:
Route:
Reference images:
Primary viewport:
Breakpoints:
Locale / direction covered:
Design tokens used:
Layout structure:
Components and variants:
States implemented:
States proposed / awaiting approval:
Responsive adaptations:
RTL adaptations:
Accessibility notes:
Known deviations and why:
Open questions:
```

## Definition of done

- [ ] Every in-scope screenshot has a matching implemented screen or a documented reason it is out of scope.
- [ ] Layout, spacing, color, typography, and icons match the approved design at the reference viewport.
- [ ] Desktop, tablet, and mobile behavior is implemented and checked.
- [ ] Arabic and English, RTL and LTR, are checked for the screen.
- [ ] All visible states and all agreed missing states are implemented.
- [ ] Shared components are reused or extended rather than duplicated.
- [ ] No unapproved visual or copy change remains.
- [ ] The screen spec and deviation list are attached to the review.

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

- `luqma-dashboard-context` — sources of truth and approval gates.
- `react-clean-architecture` — where presentational and feature components live.
- `arabic-english-rtl` — direction, typography, and mixed content.
- `dashboard-performance` — images, fonts, and render cost.
- `frontend-quality-security` — accessibility and component testing.
