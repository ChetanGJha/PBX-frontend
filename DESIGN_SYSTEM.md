# Terrix PBX Design System

## Overview
This design system provides an enterprise-grade UI foundation for the Terrix Multi-Tenant PBX application. It establishes single-source-of-truth tokens and atomic component primitives to ensure visual consistency across all administrative modules.

---

## Folder Architecture

```
src/
├── design-system/
│   ├── tokens/            # Color, Spacing, Typography, Radii, Shadows, Z-Index
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   ├── radii.ts
│   │   ├── shadows.ts
│   │   └── index.ts
│   └── tokens.css         # CSS Variables (Single Source of Truth)
├── components/
│   └── ui/                # Base primitives (Presentational only, no logic)
│       ├── Typography/    # Heading, Text
│       ├── Button/        # Button (variants: primary, secondary, danger, ghost, outline)
│       ├── Input/         # Input & FormField (label, error, hint, required)
│       ├── Badge/         # Status badges & pills
│       ├── Card/          # Surfaces & containers
│       ├── Modal/         # Dialogs with backdrop blur & Escape key handling
│       └── index.ts       # Barrel export
└── views/                 # Screen views consuming design system components
```

---

## Token Reference

### 1. Colors
- **Brand Primary**: `var(--pbx-action-primary)` (`#FF5430`)
- **Background Canvas**: `var(--pbx-bg-canvas)` (`#F8FAFC`)
- **Background Surface**: `var(--pbx-bg-surface)` (`#FFFFFF`)
- **Text Primary**: `var(--pbx-text-primary)` (`#0F172A`)
- **Text Secondary**: `var(--pbx-text-secondary)` (`#475569`)
- **Status Colors**: `success` (`#059669`), `danger` (`#DC2626`), `warning` (`#D97706`), `info` (`#2563EB`)

### 2. Spacing Scale (4px Base)
- `1` (4px), `2` (8px), `3` (12px), `4` (16px), `5` (20px), `6` (24px), `8` (32px), `10` (40px), `12` (48px), `16` (64px)

### 3. Border Radii
- `sm` (4px), `md` (8px), `lg` (12px), `xl` (16px), `full` (9999px)

---

## Component Usage Guidelines

### Button
```tsx
import { Button } from './components/ui';

<Button variant="primary" size="md" isLoading={loading}>
  Log In
</Button>
```

### FormField & Input
```tsx
import { FormField, Input } from './components/ui';

<FormField label="Username or Email" required error={errors.username}>
  <Input
    type="text"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    placeholder="Enter username"
  />
</FormField>
```

### Card & Modal
```tsx
import { Card, Modal, Heading, Text } from './components/ui';

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm Action">
  <Text>Are you sure you want to proceed?</Text>
</Modal>
```

---

## Protected Files (DO NOT TOUCH)
- `src/services/api.ts`
- `src/types.ts`
