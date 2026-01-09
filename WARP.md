# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Vue 3 + TypeScript + Vite application using the Composition API. The project uses Pinia for state management and Vue Router for routing.

**Tech Stack:**
- Vue 3.5+ with `<script setup>` syntax
- TypeScript with strict type checking via vue-tsc
- Vite 7+ for build tooling
- Pinia for state management
- Vue Router 4+ for routing
- Vitest for unit testing with jsdom environment
- ESLint + Prettier for code quality

## Development Commands

### Setup
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Starts Vite dev server with hot-reload. The application runs on http://localhost:5173 by default.

### Building
```bash
npm run build
```
Runs type-check and production build in parallel. Output goes to `dist/`.

For build-only without type checking:
```bash
npm run build-only
```

### Type Checking
```bash
npm run type-check
```
Uses vue-tsc to check TypeScript types across the entire project, including .vue files.

### Testing
```bash
npm run test:unit
```
Runs all unit tests with Vitest in watch mode.

To run tests once without watch mode:
```bash
npm run test:unit -- --run
```

To run a specific test file:
```bash
npm run test:unit -- src/components/__tests__/HelloWorld.spec.ts
```

### Linting & Formatting
```bash
npm run lint
```
Runs ESLint with auto-fix and caching enabled. Checks all .vue, .ts, .mts, and .tsx files.

```bash
npm run format
```
Formats code using Prettier. Only formats files in the `src/` directory.

### Preview Production Build
```bash
npm run preview
```
Locally preview the production build before deploying.

## Architecture

### Directory Structure
```
src/
├── assets/          # Static assets (CSS, images, etc.)
├── components/      # Reusable Vue components
│   ├── __tests__/  # Component unit tests
│   └── icons/      # Icon components
├── router/          # Vue Router configuration
├── stores/          # Pinia stores for state management
├── views/           # Page-level components (route views)
│   └── admin/      # Admin-specific views
├── App.vue          # Root component
└── main.ts          # Application entry point
```

### Key Patterns

**Component Structure:**
- Use Composition API with `<script setup lang="ts">` syntax
- Place component tests in `__tests__/` directories next to components
- Test files follow the pattern `ComponentName.spec.ts`

**State Management:**
- Pinia stores use the Composition API style (setup stores)
- Store files in `src/stores/` with descriptive names (e.g., `counter.ts`)
- Export stores using the `useXxxStore` naming convention

**Routing:**
- Router configuration in `src/router/index.ts`
- Views (page components) in `src/views/`
- Use lazy loading for route-level code splitting: `component: () => import('../views/ViewName.vue')`

**Path Aliases:**
- `@/` alias points to `src/` directory (configured in vite.config.ts)
- Use `@/` for cleaner imports: `import Foo from '@/components/Foo.vue'`

**Testing:**
- Unit tests use Vitest with jsdom environment
- Tests located in `__tests__/` directories alongside source files
- Use `@vue/test-utils` for component testing with `mount()` helper

### Code Style

**Prettier Configuration:**
- No semicolons (`semi: false`)
- Single quotes (`singleQuote: true`)
- Line width: 100 characters

**TypeScript:**
- Project uses TypeScript project references (tsconfig.json, tsconfig.app.json, tsconfig.node.json, tsconfig.vitest.json)
- Type checking is mandatory before production builds
- Use `vue-tsc` for type checking, not regular `tsc`

**ESLint:**
- Uses flat config format (eslint.config.ts)
- Vue essential rules + TypeScript recommended rules
- Vitest plugin enabled for test files
- Prettier formatting rules applied via skip-formatting

## Node.js Version Requirements

This project requires:
- Node.js ^20.19.0 or >=22.12.0

Use nvm or similar to manage Node.js versions if needed.

## Important Notes

- Do not use `tsc` for type checking - always use `npm run type-check` (which runs vue-tsc)
- The `build` command runs type-check and build in parallel using `npm-run-all2`
- Test files must be in `__tests__/` directories to be recognized by Vitest plugin rules
- When creating new routes, prefer lazy loading for better code splitting
- Assets in `public/` are served at the root path and copied as-is to dist
