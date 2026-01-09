# Tailwind CSS v4 Fix Plan

## Issue

Error: `[plugin:@tailwindcss/vite:generate:serve] Cannot apply unknown utility class border-border`

## Root Cause

The project uses Tailwind CSS v4 but has v3-style CSS configuration. In v4, utility classes like `border-border`, `bg-card`, etc. need to be defined using `@theme` or `@utility` directives.

## Fix Steps

### Step 1: Update src/assets/main.css ✅ COMPLETED

- Added `@import "tailwindcss";` at the top
- Added `@theme` directive with all color variables mapped
- Defined `--font-display` and `--font-sans` for fonts
- Fixed the `@layer base` section to use CSS custom properties instead of `@apply`

### Step 2: Update src/assets/base.css ✅ COMPLETED

- Removed the `@apply border-border;` directive
- Removed the `@apply` utilities for body and headings
- Kept only the CSS variables for color theme

## Changes Made

### main.css changes:

- Added proper Tailwind v4 `@theme` configuration with all color mappings
- Mapped all color variables like `--color-background`, `--color-border`, etc.
- Replaced `@apply` directives with direct CSS custom property usage
- Fixed the `.text-gradient` utility to use native CSS instead of Tailwind utilities

### base.css changes:

- Removed all `@apply` directives that were causing the error
- Kept the `:root` and `.dark` CSS variables for theme colors

## Result

✅ The dev server now runs successfully without the Tailwind CSS error!
