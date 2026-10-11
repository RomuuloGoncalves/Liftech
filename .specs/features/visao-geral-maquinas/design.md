# Technical & Visual Design: Visão Geral das Máquinas

## Visual Design System & Tokens

### Palette Tokens
- `--color-bg-app`: `#F8FAFC` (Slate 50 - clean industrial background)
- `--color-surface-white`: `#FFFFFF` (Pure White cards & popovers)
- `--color-surface-hover`: `#F1F5F9` (Slate 100 hover state)
- `--color-border`: `#E2E8F0` (Slate 200 light crisp borders)
- `--color-border-hover`: `#CBD5E1` (Slate 300 active card border)
- `--color-primary-blue`: `#2563EB` (Primary action blue)
- `--color-primary-light`: `#EFF6FF` (Blue 50 subtle background highlights)
- `--color-text-heading`: `#0F172A` (Slate 900 primary text)
- `--color-text-body`: `#475569` (Slate 600 secondary body & metadata)
- `--color-text-muted`: `#94A3B8` (Slate 400 icons & placeholders)
- `--color-status-success-bg`: `#DCFCE7` (Emerald 100 pill background)
- `--color-status-success-text`: `#15803D` (Emerald 700 text)

### Animation & Motion Tokens (Emil Kowalski Framework)
```css
/* Custom Easing Curves */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);     /* Snappy UI entrance & feedback */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1); /* Morphing & position shifts */

/* Micro-durations */
--duration-press: 160ms;   /* Active button scale feedback */
--duration-popover: 180ms; /* Origin-aware popover scale & fade */
--duration-card: 200ms;    /* Hover elevation & border transitions */
```

---

## Component Architecture Tree

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx             # Collapsible left navigation drawer
│   │   ├── Header.tsx              # Top bar with title & utility icons
│   │   └── AppLayout.tsx           # Shell container with responsive grid
│   ├── common/
│   │   ├── Button.tsx              # Primary & secondary button with scale(0.97) feedback
│   │   ├── Input.tsx               # Styled input with search icon & focus ring
│   │   └── Modal.tsx               # Accessible modal overlay (focus trap & @starting-style)
│   └── machines/
│       ├── ControlBar.tsx          # Search bar, filter selector & + Cadastrar button
│       ├── MachineCard.tsx         # Card displaying machine metadata & active session time
│       ├── MachineGrid.tsx         # Responsive CSS Grid container with stagger animation
│       ├── LanguagePopover.tsx     # Origin-aware popover for language selection
│       └── RegisterMachineModal.tsx# Form modal to add a new machine
├── types/
│   └── machine.ts                  # TypeScript interfaces
└── hooks/
    ├── useMachines.ts              # Custom hook for filtering & managing machine state
    └── useLanguage.ts              # Custom hook for i18n & language popover state
```

---

## Interaction & Polish Details (Emil Kowalski Standards)

1. **Button Feedback**:
   - All clickable elements (Sidebar links, buttons, card menu dots) apply `transform: scale(0.97)` on `:active` with `--ease-out` timing (160ms).

2. **Popover (Language Selector)**:
   - Popover is anchored to the Globe icon button.
   - `transform-origin` dynamically set to trigger icon center.
   - Entrance: starts at `scale(0.95)` + `opacity: 0` and animates to `scale(1)` + `opacity: 1` over 180ms `--ease-out`.
   - Accessible keyboard dismissal via `Escape` key.

3. **Machine Grid Stagger**:
   - Machine cards animate into view on mount with `@starting-style` or CSS animations.
   - Stagger delay formula: `--stagger-delay: calc(var(--index) * 35ms)`.

4. **Responsive Layout**:
   - Mobile (<768px): 1-column grid, sidebar toggles as overlay drawer.
   - Tablet (768px - 1024px): 2-column grid.
   - Desktop (1024px - 1440px): 3-column grid.
   - Wide Screen (>1440px): 4-column grid (matching the exact 4x4 16-card layout in user image).

5. **Accessibility Floor**:
   - Semantic HTML5 elements (`<aside>`, `<main>`, `<header>`, `<article>`).
   - Color contrast ratio >= 4.5:1 for all text elements.
   - Keyboard focus indicator (`outline: 2px solid #2563EB; outline-offset: 2px`).
   - `@media (prefers-reduced-motion: reduce)` disables scale/motion shifts.
