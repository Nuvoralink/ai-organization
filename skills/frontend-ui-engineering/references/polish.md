---
name: polish
description: Use when the user asks to polish, refine, final-pass, clean up, tighten, improve quality, make production-ready, or bring a UI, frontend feature, interaction, copy, form, component, page, or code change from functional to polished. Focuses on visual consistency, typography, spacing, interaction states, copy, accessibility, responsiveness, performance, edge cases, and code cleanliness. Polish is a final step after functionality is complete.
---

# Polish

Polish is the difference between shipped and truly finished. Use this as a meticulous final pass after the feature is functionally complete.

## Pre-Polish Assessment

Before polishing, confirm:

- The feature works end to end.
- Known functional issues are fixed or explicitly out of scope.
- The quality bar is clear: MVP, production feature, flagship surface, internal tool, or prototype.
- The time budget is clear enough to triage.

Do not polish incomplete work. If core behavior is broken, fix functionality first.

## Work Systematically

### Typography

- Keep hierarchy consistent: same kinds of text use the same size, weight, color, and spacing.
- Keep body line length around 45 to 75 characters when possible.
- Tune line height by text size and density.
- Avoid widows/orphans in prominent copy.
- Adjust tracking for headlines when needed.
- Prevent font loading flashes where practical.

### Color And Contrast

- Ensure text and focus indicators meet WCAG contrast.
- Use design tokens or existing palette variables instead of one-off colors.
- Keep color meaning consistent across states.
- Avoid pure black/gray when a subtly tinted neutral fits the system better.
- Do not put gray text on colored backgrounds; use a shade of that color or opacity from a readable foreground.

### Alignment And Spacing

- Align elements to the grid and to each other.
- Use the spacing scale; remove random gaps.
- Check optical alignment for icons and mixed-size elements.
- Verify spacing and alignment at every supported breakpoint.
- Fix systematic spacing problems at the system/component level where possible.

### Interaction States

Every interactive element should have appropriate states:

- Default
- Hover where pointer exists
- Focus with visible keyboard ring
- Active/pressed
- Disabled
- Loading
- Error when validation can fail
- Success or completion feedback when useful

Missing states make interfaces feel broken.

### Motion

- Use smooth, purposeful transitions around 150 to 300ms.
- Specify transition properties; avoid `transition: all`.
- Prefer natural ease-out curves. Avoid bounce/elastic unless the product is intentionally playful.
- Animate transform and opacity, not layout properties.
- Respect `prefers-reduced-motion`.

### Copy

- Use consistent terminology for the same concept.
- Apply capitalization consistently.
- Remove typos, grammar issues, filler, and vague labels.
- Keep labels concise; use sentence punctuation only where it belongs.
- Make errors helpful and recovery-oriented.

### Icons And Images

- Keep icons from the same family or matching style.
- Size and align icons consistently.
- Add meaningful alt text for content images.
- Avoid image layout shift with dimensions or aspect ratio.
- Use appropriate high-DPI/responsive assets.

### Forms

- Labels are present and associated with inputs.
- Required fields are clear.
- Validation timing is consistent.
- Error messages explain the fix.
- Tab order is logical.
- Autofocus is used only when genuinely helpful.

### Edge Cases

Check:

- Loading states for async actions.
- Empty states that guide the user.
- Error states with recovery paths.
- Success confirmation.
- Long names, long descriptions, and overflowing values.
- Missing/null data.
- Offline or network-failure behavior where relevant.

### Responsiveness

- Test mobile, tablet, desktop, and relevant landscape states.
- Touch targets are at least 44 by 44px.
- Text stays readable on mobile.
- No accidental horizontal scroll.
- Content reflows logically rather than shrinking blindly.

### Performance

- Avoid layout shift on load.
- Keep interactions smooth.
- Optimize images and heavy media.
- Lazy load below-fold content when appropriate.
- Remove unnecessary animation or expensive visual effects.

### Code Quality

- Remove debug `console.log` calls.
- Remove commented dead code.
- Remove unused imports and dependencies.
- Preserve project naming and architectural conventions.
- Avoid new `any`, ignored TypeScript errors, and brittle one-off logic.
- Use semantic HTML and ARIA only where it improves accessibility.

## Polish Checklist

Before calling the work done, confirm:

- Typography hierarchy is consistent.
- Colors use the design system.
- Contrast meets WCAG AA where required.
- Alignment works at all breakpoints.
- Spacing uses the project scale.
- Interactive states are complete.
- Transitions are smooth and purposeful.
- Copy is consistent and clean.
- Icons/images are consistent and stable.
- Forms are labeled, validated, and keyboard-friendly.
- Loading, empty, error, and success states exist.
- Touch targets are large enough.
- Keyboard navigation works.
- Focus indicators are visible.
- No console errors or warnings.
- No avoidable layout shift.
- Reduced-motion preference is respected.
- Code is clean.

## Hard Rules

- Never polish before functionality is complete.
- Do not spend flagship-level polish time on a 30-minute patch; triage to risk and value.
- Do not introduce bugs while polishing. Verify after changes.
- Do not perfect one tiny detail while leaving the rest rough.
- Fix systematic issues upstream rather than repeating local tweaks everywhere.

## Final Verification

Use the feature yourself. Exercise happy path, loading, failure, keyboard, mobile, and edge cases. Compare against the intended design and product outcome. When feasible, verify on real devices or browser screenshots rather than only reading code.

Polish until it feels effortless, intentional, and reliable.
