---
name: Construct Core
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  status-active: '#22C55E'
  status-on-hold: '#FACC15'
  status-completed: '#3B82F6'
  border-subtle: '#E2E8F0'
  text-main: '#1E293B'
  text-muted: '#64748B'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  table-row-condensed: 8px
  table-row-standard: 12px
  container-padding: 24px
---

## Brand & Style
The brand personality is defined by industrial reliability fused with modern cloud performance. It communicates institutional trust through a "Premium Corporate" lens, designed specifically for high-stakes infrastructure management. 

The design system adopts a **Modern Corporate** style with subtle **Minimalist** influences. It prioritizes information density and clarity—essential for ERP workflows—while utilizing soft depth and refined accents to avoid the utilitarian coldness of legacy enterprise software. The aesthetic is polished, precise, and high-performance, ensuring that complex data feels organized rather than overwhelming.

## Colors
The palette is anchored by "Infrastructure Navy" (#0F172A), representing stability and the corporate foundation. "Construction Orange" (#F97316) is used sparingly as a high-visibility accent for primary actions and critical alerts, drawing the eye to the most important task on any screen.

Surface hierarchy is maintained through a "Pure White" (#FFFFFF) for cards and containers, set against a "Slate Tint" background (#F8FAFC) to reduce eye strain during long working sessions. Construction-specific semantic colors are defined to provide immediate status recognition in project logs:
- **Active:** A vibrant green representing progress and safety.
- **On Hold:** A high-contrast yellow for caution and pause.
- **Completed:** A calm, reliable blue signaling closure and delivery.

## Typography
Inter is utilized across all levels to take advantage of its exceptional legibility in data-heavy environments. The scale is optimized for ERP density:
- **Headlines:** Use tighter letter-spacing and heavier weights to establish clear section hierarchy.
- **Body Text:** Uses a 14px base for standard data entry, providing a balance between information density and readability.
- **Labels:** Small, all-caps or medium-weight labels are used for table headers and metadata to distinguish them clearly from interactive content.
- **Data Tables:** Should utilize `body-md` for row content and `label-sm` for headers.

## Layout & Spacing
This design system employs a **Fixed Grid** model for dashboard layouts to maintain consistency across professional monitors, while switching to a fluid 4-column layout for mobile. 

The spacing rhythm is built on a 4px baseline grid. For the ERP's core—data tables—two density modes are supported:
- **Standard:** 12px vertical padding for general project management.
- **Condensed:** 8px vertical padding for high-volume financial or inventory logs.

Dashboards follow a 12-column grid system with 24px gutters. Primary sidebars are fixed at 280px to ensure navigation remains consistent regardless of viewport width.

## Elevation & Depth
Depth is conveyed using **Tonal Layers** combined with **Ambient Shadows**. This approach mirrors the physical layering of construction blueprints and architectural sheets.

- **Level 0 (Background):** #F8FAFC - The base canvas.
- **Level 1 (Cards/Containers):** #FFFFFF - Uses a very soft, diffused shadow (0px 4px 6px rgba(15, 23, 42, 0.05)) to lift content off the background.
- **Level 2 (Dropdowns/Modals):** Elevated with a more pronounced shadow and a 1px border (#E2E8F0) to ensure distinct separation from the underlying content.
- **Active State:** Elements like selected sidebar items use a subtle tonal shift rather than a shadow to indicate "pressed" or "active" status.

## Shapes
In alignment with the user request, a consistent 12px (0.75rem) corner radius is applied to all primary UI elements, including cards, input fields, and buttons. This "Rounded" profile softens the technical nature of the ERP, making the software feel modern and approachable. 

- **Small Components:** Checkboxes and radio buttons use a reduced 4px radius.
- **Chips/Status Badges:** Use a fully rounded "Pill" shape to distinguish them from interactive buttons.
- **Primary Buttons:** 12px radius to match container shapes.

## Components
- **Buttons:** Primary buttons use the Navy Blue background with White text. Secondary buttons use a transparent background with a 1px Slate border. The Orange accent is reserved for "Action-Primary" items like "Create New Project."
- **Status Chips:** These feature a low-opacity background of the semantic color with high-contrast text (e.g., Active status uses a light green background with dark green text).
- **Input Fields:** Use 12px rounded corners, a 1px border (#E2E8F0), and a 16px horizontal padding. On focus, the border shifts to Navy Blue with a subtle 2px glow.
- **Data Tables:** Rows should include a subtle hover state (#F1F5F9). Headers are "sticky" and use the `label-sm` typography style with a bottom border but no background color.
- **Cards:** Always white, 12px rounded, with a soft Level 1 shadow. Grouped information within cards should be separated by 1px horizontal dividers (#F1F5F9).
- **Progress Bars:** Utilize the Orange accent to show completion percentage against a Light Gray track.