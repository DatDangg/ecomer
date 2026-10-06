# Design Tokens: Ecommerce Team Project

> Project UI system derived from `docs/DESIGN.md` and confirmed Phase 1 choices. Use these semantic tokens for every screen. The product is a light-theme commerce application, not the dark cinematic marketing track described in the source inspiration.

## Design Read and Dials

**Design Read:** Reading this as a multi-seller commerce web app for Vietnamese shoppers, sellers, and administrators, with a minimal, trust-first Shopify VN-inspired language, leaning toward customized shadcn/ui with Tailwind utilities.

- `DESIGN_VARIANCE: 5/10` - restrained, with layout variation only where it helps product discovery or admin workflows.
- `MOTION_INTENSITY: 3/10` - mostly static; brief transitions communicate focus, submission, and state changes.
- `VISUAL_DENSITY: 5/10` - comfortable daily-use density; transactional screens remain scannable without decorative whitespace.

## System Rules

- One page theme: light. Canvas polarity is limited to white (`#ffffff`) and soft neutral surface (`#f5f5f5`). No dark sections or dark-mode theme in this MVP.
- Black is the explicit brand primary and is intentionally retained despite generic anti-slop advice against pure black.
- Buttons are always pill-shaped. Inputs use the documented form radius; content groups use the documented container radius. No arbitrary radius variants.
- Use 1px hairlines to organize content. Default surfaces are flat; shadows are reserved for overlays that must float above content.
- Headings enable OpenType `ss03`. The UI is Vietnamese-first and prices use VNĐ formatting.
- Core UI is monochrome. Semantic status colors are limited to status text/icons and never introduce a third page canvas.
- shadcn/ui is the single component foundation, customized to these tokens. Use Lucide icons because the canonical frontend stack names `lucide-react`; never substitute emoji for interface icons.

## Colors

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#000000` | Primary actions, selected navigation, strong emphasis |
| `--color-primary-hover` | `#262626` | Hover/focus-adjacent primary button state |
| `--color-primary-pressed` | `#404040` | Pressed primary action |
| `--color-on-primary` | `#ffffff` | Text/icons on primary black |
| `--color-background` | `#ffffff` | Main application canvas |
| `--color-surface` | `#f5f5f5` | Secondary panels, filter wells, quiet grouped areas |
| `--color-surface-raised` | `#ffffff` | Forms, menus, dialogs, product images on the light canvas |
| `--color-border` | `#e5e5e5` | 1px hairline dividers and control outlines |
| `--color-border-strong` | `#a3a3a3` | High-emphasis control boundary when needed |
| `--color-text-primary` | `#000000` | Headings, body copy, labels |
| `--color-text-secondary` | `#52525b` | Supporting copy and metadata; passes AA on both canvases |
| `--color-text-muted` | `#62626b` | Placeholder/helper copy only when contrast remains AA |
| `--color-link` | `#000000` | Text links, underlined on hover and always distinguishable by more than color |
| `--color-success` | `#067647` | Success status text/icon |
| `--color-warning` | `#854d0e` | Warning status text/icon |
| `--color-error` | `#b42318` | Error status text/icon and inline validation |
| `--color-focus-ring` | `#000000` | 2px visible keyboard focus ring with 2px offset |

Semantic foreground colors are paired with an icon or explicit text label; status must never be conveyed by color alone. Status content inherits either the white or `#f5f5f5` canvas.

## Typography

Display/headings use the project's documented Neue Haas Grotesk Display stack where a licensed/self-hosted font asset is available. Otherwise use the listed system fallback without downloading an undeclared remote font. UI/body uses Inter Variable when bundled, then system sans-serif.

```css
--font-family-heading: "Neue Haas Grotesk Display", "Helvetica Neue", Helvetica, Arial, sans-serif;
--font-family-base: "Inter Variable", Inter, system-ui, sans-serif;
--font-family-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
--font-feature-settings: "ss03";
```

Apply `font-feature-settings: "ss03"` to the document root so headings and UI copy share the documented typographic signature. Body default is 1rem (16px) with 1.5 line-height. Use rem/clamp for implemented font sizing.

| Token | Size | Weight | Line height | Use |
|---|---:|---:|---:|---|
| `--font-size-xs` | 0.75rem / 12px | 500 | 1.4 | Dense metadata only, never essential instructions |
| `--font-size-sm` | 0.875rem / 14px | 400-500 | 1.5 | Helper text, secondary metadata |
| `--font-size-base` | 1rem / 16px | 400 | 1.5 | Body, controls, form values |
| `--font-size-lg` | 1.125rem / 18px | 500 | 1.45 | Lead copy and prominent item names |
| `--font-size-xl` | 1.25rem / 20px | 500 | 1.4 | Compact section heading |
| `--font-size-2xl` | 1.5rem / 24px | 500 | 1.3 | Page subsection heading |
| `--font-size-3xl` | 1.875rem / 30px | 500 | 1.2 | Page title on mobile/tablet |
| `--font-size-4xl` | clamp(2rem, 2.5vw + 1rem, 2.75rem) | 400-500 | 1.12 | Page title on wide desktop, use sparingly |
| `--font-weight-normal` | 400 | - | - | Body text |
| `--font-weight-medium` | 500 | - | - | Labels, controls, selected items |
| `--font-weight-semibold` | 600 | - | - | Strong labels and compact action emphasis |
| `--font-weight-bold` | 700 | - | - | Rare emphasis only |

## Spacing

Use a 4px sub-grid with 8px as the common rhythm. Build mobile-first, prefer this scale and fluid values over arbitrary pixel measurements.

| Token | Value |
|---|---:|
| `--spacing-2xs` | 2px |
| `--spacing-xs` | 4px |
| `--spacing-sm` | 8px |
| `--spacing-md` | 12px |
| `--spacing-base` | 16px |
| `--spacing-lg` | 24px |
| `--spacing-xl` | 32px |
| `--spacing-2xl` | 48px |
| `--spacing-3xl` | 64px |

Use 16px minimum page gutters at 375px, 24px at 768px, and 32px at 1280px. Content containers are fluid with a maximum width around 1280px. Forms and purchase summaries use 16-24px internal spacing.

## Border Radius

| Token | Value | Usage |
|---|---:|---|
| `--radius-sm` | 4px | Small chips and image detail only |
| `--radius-md` | 8px | Inputs, selects, textareas, thumbnail frames |
| `--radius-lg` | 12px | Grouped content sections, product media well, dialogs |
| `--radius-xl` | 16px | Large modal/image groups only when hierarchy requires it |
| `--radius-full` | 9999px | Every button, compact filter chip, status pill |

Documented shape rule: pill controls; 8px form fields; 12px grouping/media containers; sharp 1px dividers. Do not round every region by default.

## Shadows and Borders

| Token | Value | Usage |
|---|---|---|
| `--shadow-none` | `none` | Default panels and cards |
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.04)` | Dropdown/popover separation only |
| `--shadow-md` | `0 8px 24px rgba(0, 0, 0, 0.08)` | Dialogs and command surfaces only |
| `--shadow-lg` | `0 16px 40px rgba(0, 0, 0, 0.12)` | Avoid unless a future overlay requires clear elevation |
| `--border-hairline` | `1px solid #e5e5e5` | Lists, section boundaries, controls |

Do not use shadows as a substitute for layout hierarchy. Never add decorative glow.

## Interaction and Accessibility Tokens

- Minimum interactive target: 44 x 44px. Pill buttons use at least 12px vertical padding; icon-only actions retain a 44px hit area and an accessible name.
- Keyboard focus: 2px solid black outline, 2px offset; never remove without an equivalent visible replacement.
- Control label and body text contrast: at least 4.5:1. Large text minimum: 3:1. Keep helper/placeholder text at 4.5:1 as well.
- Button transitions: 150-200ms, transform/opacity/color only. Press feedback may use `scale(0.98)`; respect `prefers-reduced-motion` and avoid automatic motion.
- Inline errors remain adjacent to the relevant field, are announced accessibly, and include textual explanation.
- Loading uses layout-matched skeletons with reserved image dimensions to prevent layout shift. Empty/error states provide plain next actions.

## Responsive Breakpoints

Canonical screens: 375px mobile, 768px tablet, 1280px desktop. Enhance from mobile upward. Use the documented `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px` Tailwind scale; do not create horizontal page overflow.
