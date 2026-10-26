# Specification: Header Principal

## Overview
A reusable top `Header` component rendered above the routed page content, alongside the existing `Sidebar`. It shows the current page title and global utility actions: language selector (Globe + popover), notifications (Bell), and user profile (Avatar). Visual language matches `Sidebar.tsx` / `Sidebar.module.css` (CSS variables, `--ease-out` easing, `scale(0.97)` active feedback). Layout is fluid: full width on desktop, adapts alongside the collapsed/mobile sidebar.

## Problem Statement
The app shell currently only renders the `Sidebar`; there is no persistent top header, so pages have no consistent place to show the current section's title or reach global actions (language, notifications, profile). Issue #51 asks for this header, mirroring the reference mockup and the Sidebar's established visual system.

## User Stories
- As a fleet operator, I want to see which page I'm on and access language/notification/profile actions from any screen, so I don't have to hunt for them per page.
- As a developer, I want a single `Header` component reused across all routes, so page-specific components stay focused on their own content.

## Out of Scope
- Notification list content/dropdown body (bell only exposes the affordance for now).
- Profile menu content (avatar only exposes the affordance for now).
- Actual i18n string switching / persisted language preference.
- Search bar and "Cadastrar Máquina" controls — those belong to the `visao-geral-maquinas` feature's control bar, not the global Header.

## Requirements (EARS Notation)

### HD-001: Header Rendering & Page Title
- **WHEN** the user views any dashboard route, **THE** system **SHALL** render a `Header` fixed above the page content showing the title of the current route (e.g. "Visão Geral", "Gerenciamento Frota", "Gestão de Equipe", "Histórico de Alertas").
- **Acceptance Criteria**:
  - `AC-HD-001.1`: The header MUST render the title text matching the active route.
  - `AC-HD-001.2`: The header MUST span the full width of the content area and remain fluid on window resize (no horizontal overflow at 320px–1920px widths).

### HD-002: Language Selector
- **WHEN** the user clicks the Globe icon button, **THE** system **SHALL** open an "Escolha um idioma" popover listing: Português (Brasil), Inglês, Espanhol, Francês, Japonês, Alemão, Russo, each with a radio indicator and flag emoji.
- **Acceptance Criteria**:
  - `AC-HD-002.1`: Popover is closed by default and opens on Globe click.
  - `AC-HD-002.2`: Clicking a language option marks it selected (radio checked) and closes no other option.
  - `AC-HD-002.3`: Pressing `Escape` or clicking outside the popover MUST close it.
  - `AC-HD-002.4`: The popover MUST have a close (`X`) button that also closes it.

### HD-003: Notification & Profile Actions
- **WHEN** the header renders, **THE** system **SHALL** display a Bell (notifications) icon button and a User (profile) avatar button, both reachable by keyboard and with accessible labels.
- **Acceptance Criteria**:
  - `AC-HD-003.1`: Both buttons expose an `aria-label`.
  - `AC-HD-003.2`: Buttons render as circular icon buttons matching the Sidebar's icon-button visual style.

### HD-004: Responsive Layout
- **WHEN** the viewport is below 768px (mobile, matching Sidebar's breakpoint), **THE** system **SHALL** shift header content to leave room for the Sidebar's hamburger trigger and keep all actions reachable without overlap.
- **Acceptance Criteria**:
  - `AC-HD-004.1`: On mobile widths the header title does not overlap the Sidebar's hamburger button.
  - `AC-HD-004.2`: Icon actions remain visible and clickable at 320px width.

## Data Models
```typescript
export type SupportedLanguage = 'pt-BR' | 'en-US' | 'es' | 'fr' | 'ja' | 'de' | 'ru'
```

## Assumptions & Open Questions
- Notification and profile buttons only need to expose their affordance (icon + aria-label) for this issue; their dropdown content (notification list, profile menu) is out of scope and will be a follow-up feature.
- Selected language is local UI state only (no i18n string-switching wiring) for this issue, consistent with the existing `visao-geral-maquinas` spec which scoped the same popover the same way.
Open questions: none.

## Requirement Traceability

| Requirement | Test(s) | Status |
|---|---|---|
| HD-001 | `Header.test.tsx` — renders route title; no horizontal overflow on resize | Pending |
| HD-002 | `Header.test.tsx` — popover open/close, selection, Escape/outside-click, close button | Pending |
| HD-003 | `Header.test.tsx` — aria-labels and icon-button rendering for Bell/Avatar | Pending |
| HD-004 | `Header.test.tsx` — mobile viewport layout, actions clickable at 320px | Pending |
